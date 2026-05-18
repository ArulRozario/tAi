import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { hashPassword } from './password.util';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  const mockJwt = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(mockPrisma as any, mockJwt as any, {} as any);
  });

  describe('validateUser', () => {
    it('should return user excluding passwordHash if valid and active', async () => {
      const plainPassword = 'securepassword123';
      const hp = hashPassword(plainPassword);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'Arul',
        role: 'REVIEWER',
        isActive: true,
        passwordHash: hp,
      });

      const result = await service.validateUser('user@example.com', plainPassword);
      expect(result).toBeDefined();
      expect(result.id).toBe('u1');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should return null if password mismatch', async () => {
      const plainPassword = 'securepassword123';
      const hp = hashPassword(plainPassword);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'Arul',
        role: 'REVIEWER',
        isActive: true,
        passwordHash: hp,
      });

      const result = await service.validateUser('user@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const plainPassword = 'securepassword123';
      const hp = hashPassword(plainPassword);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'Arul',
        role: 'REVIEWER',
        isActive: false,
        passwordHash: hp,
      });

      const result = await service.validateUser('user@example.com', plainPassword);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should perform successful login and persist refresh token', async () => {
      const plainPassword = 'securepassword123';
      const hp = hashPassword(plainPassword);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'Arul',
        role: 'REVIEWER',
        isActive: true,
        passwordHash: hp,
      });

      mockJwt.sign.mockReturnValue('mock-jwt-access-token');
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const response = await service.login('user@example.com', plainPassword, true);

      expect(response.accessToken).toBe('mock-jwt-access-token');
      expect(response.refreshToken).toBeDefined();
      expect(response.user.id).toBe('u1');
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid login credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('user@example.com', 'any', false)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should rotate refresh tokens and return new pairs (RTR)', async () => {
      const oldRefreshToken = 'old-rt';

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: oldRefreshToken,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'u1',
          email: 'user@example.com',
          role: 'REVIEWER',
          isActive: true,
        },
      });

      mockPrisma.refreshToken.delete.mockResolvedValue({ token: oldRefreshToken });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'new-rt' });
      mockJwt.sign.mockReturnValue('new-jwt-access-token');

      const response = await service.refresh(oldRefreshToken);

      expect(response.accessToken).toBe('new-jwt-access-token');
      expect(response.refreshToken).toBeDefined();
      expect(response.refreshToken).not.toBe(oldRefreshToken);

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: oldRefreshToken },
      });
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token does not exist', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('nonexistent')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException and delete token if expired', async () => {
      const expiredToken = 'expired-rt';

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: expiredToken,
        expiresAt: new Date(Date.now() - 100000),
        user: { id: 'u1' },
      });

      mockPrisma.refreshToken.delete.mockResolvedValue({ token: expiredToken });

      await expect(service.refresh(expiredToken)).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: expiredToken },
      });
    });
  });

  describe('logout', () => {
    it('should revoke active refresh token in database', async () => {
      const activeToken = 'revoke-me';
      mockPrisma.refreshToken.delete.mockResolvedValue({ token: activeToken });

      await service.logout(activeToken);

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: activeToken },
      });
    });

    it('should ignore deletion errors', async () => {
      const activeToken = 'revoke-me';
      mockPrisma.refreshToken.delete.mockRejectedValue(new Error('not found'));

      await expect(service.logout(activeToken)).resolves.toBeUndefined();
    });
  });

  describe('password reset flow', () => {
    it('should generate JWT reset token on forgotPassword and log link', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
      });
      mockJwt.sign.mockReturnValue('jwt-reset-token-xyz');

      await service.forgotPassword('user@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { sub: 'u1', email: 'user@example.com', purpose: 'password-reset' },
        { expiresIn: '1h' },
      );
    });

    it('should throw on forgotPassword for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.forgotPassword('nonexistent@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('should reset password, hash new value, and revoke all sessions', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'u1', email: 'user@example.com', purpose: 'password-reset' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'u1', email: 'user@example.com' });
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      await service.resetPassword('valid-jwt-token', 'newsecurepassword777');

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
    });

    it('should throw UnauthorizedException for invalid reset token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(
        service.resetPassword('invalid-token', 'newpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired reset token', async () => {
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await expect(
        service.resetPassword('expired-token', 'newpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if token purpose is not password-reset', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'u1', email: 'user@example.com', purpose: 'other' });

      await expect(
        service.resetPassword('wrong-purpose-token', 'newpassword'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

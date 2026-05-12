import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { comparePassword, hashPassword } from './password.util';
import { randomBytes } from 'crypto';

interface ResetTokenInfo {
  email: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // Ephemeral in-memory storage for password reset tokens
  private resetTokens = new Map<string, ResetTokenInfo>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials against the database using our secure scrypt hashing comparison.
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return null;
    }

    const isValid = comparePassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  /**
   * Log in a user, generate an Access Token (15m expiry) and a DB-backed Refresh Token (7d or 30d expiry).
   */
  async login(email: string, password: string, rememberMe = false) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Determine refresh token TTL based on rememberMe flag
    const ttlDays = rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    // Create secure random 40-byte hex refresh token
    const refreshTokenString = randomBytes(40).toString('hex');

    // Persist refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    // Sign Access Token with 15 minutes expiration time
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Perform Refresh Token Rotation (RTR). Validates the refresh token, revokes it,
   * and generates a brand new access and refresh token pair.
   */
  async refresh(refreshTokenString: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token from database
      await this.prisma.refreshToken.delete({ where: { token: refreshTokenString } }).catch(() => {
        // ignore deletion errors
      });
      throw new UnauthorizedException('Expired refresh token');
    }

    const user = tokenRecord.user;
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Revoke the old refresh token (Refresh Token Rotation!)
    await this.prisma.refreshToken.delete({ where: { token: refreshTokenString } }).catch(() => {
      // ignore deletion errors
    });

    // Issue a new refresh token with the same TTL duration (e.g. 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const newRefreshTokenString = randomBytes(40).toString('hex');

    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    // Sign new access token (15m expiry)
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      accessToken,
      refreshToken: newRefreshTokenString,
    };
  }

  /**
   * Revoke/delete a refresh token to cleanly log out a user.
   */
  async logout(refreshTokenString: string) {
    await this.prisma.refreshToken.delete({ where: { token: refreshTokenString } }).catch(() => {
      // ignore deletion errors
    });
  }

  /**
   * Generate an ephemeral reset token and log the recovery flow.
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Silent success for email protection/enumeration guard
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Generate secure reset token and expire in 1 hour
    const token = randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    this.resetTokens.set(token, { email, expiresAt });

    this.logger.log(`Password reset token issued for: ${email}`);
  }

  /**
   * Complete password reset flow using ephemeral token, hash new password, and revoke active sessions.
   */
  async resetPassword(token: string, newPassword: string) {
    const resetInfo = this.resetTokens.get(token);
    if (!resetInfo) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (resetInfo.expiresAt < new Date()) {
      this.resetTokens.delete(token);
      throw new UnauthorizedException('Expired reset token');
    }

    // Token is valid, consume it
    this.resetTokens.delete(token);

    const user = await this.prisma.user.findUnique({ where: { email: resetInfo.email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update user password with secure hash
    await this.prisma.user.update({
      where: { email: resetInfo.email },
      data: { passwordHash: hashPassword(newPassword) },
    });

    // Revoke all active session refresh tokens for security
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    
    this.logger.log(`Password reset successfully for user: ${resetInfo.email}. Revoked all active sessions.`);
  }

  /**
   * Retrieve current active user profile information.
   */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
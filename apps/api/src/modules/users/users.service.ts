import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../auth/password.util';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves users with pagination, search, and filtering.
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isActive?: boolean;
    sortBy?: 'name' | 'email' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: { refreshTokens: { where: { expiresAt: { gt: new Date() } } } },
          },
          refreshTokens: {
            where: { expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const userResponses = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl ?? null,
      sessionCount: user._count.refreshTokens,
      lastActiveAt: user.refreshTokens[0]?.createdAt || null,
      createdAt: user.createdAt,
    }));

    return {
      users: userResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves a single user by ID with active sessions.
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        refreshTokens: {
          where: { expiresAt: { gt: new Date() } },
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    return {
      ...user,
      avatarUrl: user.avatarUrl ?? null,
      sessionCount: user.refreshTokens.length,
    };
  }

  /**
   * Creates a new user with a temporary password that must be changed on first login.
   * Returns the temporary password so it can be shared with the user.
   */
  async create(name: string, email: string, role: Role): Promise<{
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: Date;
    temporaryPassword: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${email}' is already registered in the system.`);
    }

    const tempPassword = randomBytes(8).toString('base64url');
    const passwordHash = hashPassword(tempPassword);

    const newUser = await this.prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        role,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    this.logger.log(`User created: ${newUser.email} (${newUser.role}) — temporary password issued`);

    return {
      ...newUser,
      temporaryPassword: tempPassword,
    };
  }

  /**
   * Updates an existing user's administrative profile.
   */
  async update(id: string, data: { name?: string; role?: Role; isActive?: boolean }) {
    // 1. Ensure user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    // 2. Perform update
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Administratively resets a user's password to a fresh temporary password.
   * Purges all active database login sessions for immediate safety.
   * Sets mustChangePassword to true so user must change on next login.
   */
  async resetPassword(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    const tempPassword = randomBytes(6).toString('hex');
    const passwordHash = hashPassword(tempPassword);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });

    const revokedSessions = await this.prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    this.logger.log(
      `Administratively reset password for user '${user.email}'. Revoked ${revokedSessions.count} active login session(s).`
    );
  }

  /**
   * Deactivates a user, preventing login and revoking all sessions.
   */
  async deactivate(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Cannot deactivate yourself');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    if (!user.isActive) {
      throw new BadRequestException('User is already deactivated');
    }

    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User deactivated: ${user.email}`);
    return updatedUser;
  }

  /**
   * Reactivates a deactivated user.
   */
  async reactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User reactivated: ${user.email}`);
    return updatedUser;
  }
}
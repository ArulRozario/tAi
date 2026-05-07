import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
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
   * Retrieves all users registered in the system, excluding password hashes.
   * Ordered newest first.
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        isActive: true, 
        createdAt: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Invites a new user to the system. Generates a temporary credentials set,
   * hashes and stores it, and triggers a mock email notification.
   */
  async invite(name: string, email: string, role: Role) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Ensure email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${email}' is already registered in the system.`);
    }

    // 2. Generate cryptographically strong random temporary password (12 characters)
    const tempPassword = randomBytes(6).toString('hex');
    const passwordHash = hashPassword(tempPassword);

    // 3. Persist the new user (default to active)
    const newUser = await this.prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    // 4. Log mock transactional email to developer console
    this.logger.log(`
================================================================================
[TRANSACTIONAL EMAIL] User Invitation Sent
To: ${newUser.email}
Name: ${newUser.name}
Role: ${newUser.role}
--------------------------------------------------------------------------------
Your account has been created on tAI.
Please log in using these temporary credentials:

Email: ${newUser.email}
Password: ${tempPassword}

Security Warning: You must update your password immediately upon your first login.
================================================================================
`);

    return newUser;
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
   */
  async resetPassword(id: string): Promise<void> {
    // 1. Ensure user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    // 2. Generate and hash a new temporary password
    const tempPassword = randomBytes(6).toString('hex');
    const passwordHash = hashPassword(tempPassword);

    // 3. Update password in the database
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // 4. Purge all active Refresh Tokens (force complete logout on all devices)
    const revokedSessions = await this.prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    this.logger.log(
      `Administratively reset password for user '${user.email}'. Revoked ${revokedSessions.count} active login session(s).`
    );

    // 5. Log mock password reset transactional email
    this.logger.log(`
================================================================================
[TRANSACTIONAL EMAIL] Administrative Password Reset
To: ${user.email}
Name: ${user.name}
--------------------------------------------------------------------------------
An administrator has reset your tAI account password.
Please log in using this temporary password:

Password: ${tempPassword}

Security Warning: Please change your password under your settings profile immediately.
================================================================================
`);
  }
}
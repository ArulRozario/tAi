import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  UseGuards, 
  ParseUUIDPipe, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsBoolean 
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

export class InviteUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsEnum(Role, { message: 'Role must be ADMIN, MASTER, or REVIEWER' })
  @IsNotEmpty({ message: 'Role is required' })
  role!: Role;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Role, { message: 'Role must be ADMIN, MASTER, or REVIEWER' })
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Retrieves all users (excluding sensitive details).
   * Authorized: ADMIN and MASTER tiers.
   */
  @Get()
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * Invites a user and generates temporary credentials.
   * Authorized: ADMIN tier only.
   */
  @Post('invite')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async invite(@Body() inviteUserDto: InviteUserDto) {
    return this.usersService.invite(
      inviteUserDto.name, 
      inviteUserDto.email, 
      inviteUserDto.role
    );
  }

  /**
   * Modifies an existing user's details.
   * Authorized: ADMIN tier only.
   */
  @Patch(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Administratively resets a user's credentials and kills active sessions.
   * Authorized: ADMIN tier only.
   */
  @Post(':id/reset-password')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.resetPassword(id);
  }
}
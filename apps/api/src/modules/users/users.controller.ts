import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
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
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';
import { ListUsersDto } from './dto';

export class CreateUserDto {
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
   * Retrieves users with pagination, search, and filtering.
   * Authorized: ADMIN and MASTER tiers.
   */
  @Get()
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListUsersDto) {
    return this.usersService.findAll(query);
  }

  /**
   * Retrieves a single user by ID with active sessions.
   * Authorized: ADMIN and MASTER tiers.
   */
  @Get(':id')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Creates a new user with a temporary password that must be changed on first login.
   * Authorized: ADMIN tier only.
   */
  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(
      createUserDto.name,
      createUserDto.email,
      createUserDto.role
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

  /**
   * Deactivates a user, preventing login and revoking all sessions.
   * Authorized: ADMIN tier only.
   */
  @Post(':id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any
  ) {
    return this.usersService.deactivate(id, currentUser.id);
  }

  /**
   * Reactivates a deactivated user.
   * Authorized: ADMIN tier only.
   */
  @Post(':id/reactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.reactivate(id);
  }
}
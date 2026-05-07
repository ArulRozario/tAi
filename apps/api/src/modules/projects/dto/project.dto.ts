import { IsString, IsOptional, IsEnum, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @MinLength(2, { message: 'sourceLang must be a valid language code' })
  @MaxLength(10)
  sourceLang!: string;

  @IsString()
  @MinLength(2, { message: 'targetLang must be a valid language code' })
  @MaxLength(10)
  targetLang!: string;

  @IsUUID('4', { message: 'genreId must be a valid UUID' })
  genreId!: string;

  @IsString()
  @IsOptional()
  sourceFileId?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ProjectStatus, { message: 'Status must be a valid ProjectStatus enum value' })
  @IsOptional()
  status?: ProjectStatus;
}
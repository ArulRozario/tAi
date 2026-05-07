import { IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { JobType } from '@prisma/client';

export class CreateJobDto {
  @IsEnum(JobType, { message: 'Type must be a valid JobType enum value' })
  type!: JobType;

  @IsUUID('4', { message: 'projectId must be a valid UUID' })
  @IsOptional()
  projectId?: string;

  @IsUUID('4', { message: 'pageId must be a valid UUID' })
  @IsOptional()
  pageId?: string;

  @IsObject({ message: 'payload must be a valid JSON object' })
  @IsOptional()
  payload?: any;
}

import { IsOptional, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

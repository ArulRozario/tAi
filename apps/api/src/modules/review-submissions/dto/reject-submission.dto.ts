import { IsOptional, IsString } from 'class-validator';

export class RejectSubmissionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

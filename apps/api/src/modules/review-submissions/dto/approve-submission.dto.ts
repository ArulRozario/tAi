import { IsOptional, IsString } from 'class-validator';

export class ApproveSubmissionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

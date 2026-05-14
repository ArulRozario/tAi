import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';

export class ChatMessageDto {
  @IsString() @IsNotEmpty() role!: string;
  @IsString() @IsNotEmpty() content!: string;
}

export class ChatDto {
  @IsString()
  @IsIn(['styleGuide', 'segment', 'pageReview', 'general'])
  context!: string;

  @IsString() @IsOptional() entityId?: string;

  @IsString() @IsOptional() segmentId?: string;

  @IsString() @IsNotEmpty() prompt!: string;

  @IsString() @IsOptional() mode?: string;

  @IsString() @IsOptional() model?: string;

  @IsString() @IsOptional() currentContent?: string;

  @IsArray() @IsOptional() history?: ChatMessageDto[];
}

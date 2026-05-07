import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateChapterDto {
  @IsInt({ message: 'chapterNumber must be an integer' })
  @Min(1, { message: 'chapterNumber must be at least 1' })
  @IsNotEmpty({ message: 'chapterNumber is required' })
  chapterNumber!: number;

  @IsString()
  @IsOptional()
  title?: string;
}

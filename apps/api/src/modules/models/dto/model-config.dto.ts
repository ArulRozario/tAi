import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { Provider } from '@prisma/client';

export class UpdateModelConfigDto {
  @IsEnum(Provider, {
    message: 'provider must be either OLLAMA or ANTHROPIC',
  })
  @IsNotEmpty()
  provider!: Provider;

  @IsString()
  @IsNotEmpty()
  modelName!: string;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;
}

import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  icon?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @IsUUID('4')
  @IsOptional()
  parentId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}

export class UpdateCollectionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  icon?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  /** Pass null to promote to root. */
  @IsUUID('4')
  @IsOptional()
  parentId?: string | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}

export class AssignProjectDto {
  @IsUUID('4')
  @IsOptional()
  collectionId?: string | null;
}

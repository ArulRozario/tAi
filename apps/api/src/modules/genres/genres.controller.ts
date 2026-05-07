import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  ParseUUIDPipe, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { GenresService } from './genres.service';
import { 
  IsNotEmpty, 
  IsString, 
  IsOptional 
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

export class CreateGenreDto {
  @IsString()
  @IsNotEmpty({ message: 'Genre name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Genre key identifier is required' })
  key!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsString()
  @IsOptional()
  userPromptTemplate?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateGenreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsString()
  @IsOptional()
  userPromptTemplate?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

@Controller('genres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  /**
   * Retrieves all registered genres.
   * Authorized: All authenticated users (ADMIN, MASTER, REVIEWER).
   */
  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.genresService.findAll();
  }

  /**
   * Retrieves a single genre detail by ID.
   * Authorized: All authenticated users (ADMIN, MASTER, REVIEWER).
   */
  @Get(':id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.genresService.findOne(id);
  }

  /**
   * Creates a new genre.
   * Authorized: ADMIN only.
   */
  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: { id: string },
    @Body() createGenreDto: CreateGenreDto
  ) {
    return this.genresService.create(user.id, createGenreDto);
  }

  /**
   * Modifies an existing genre completely (PUT specification).
   * Authorized: ADMIN only.
   */
  @Put(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGenreDto: UpdateGenreDto
  ) {
    return this.genresService.update(id, updateGenreDto);
  }

  /**
   * Removes a genre.
   * Authorized: ADMIN only.
   */
  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.genresService.delete(id);
  }
}

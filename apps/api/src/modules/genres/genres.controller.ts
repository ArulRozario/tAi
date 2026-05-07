import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { GenresService } from './genres.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

export class CreateGenreDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() icon?: string;
  @IsString() @IsOptional() color?: string;
}

export class UpdateGenreDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() icon?: string;
  @IsString() @IsOptional() color?: string;
  @IsString() @IsOptional() segmentUnit?: string;
}

export class CreateVersionDto {
  @IsString() @IsNotEmpty() content!: string;
  @IsString() @IsOptional() note?: string;
}

export class TestGenreDto {
  @IsString() @IsNotEmpty() sampleText!: string;
}

@Controller('genres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findAll(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.genresService.findAll(q, limit ? parseInt(limit, 10) : undefined);
  }

  @Get(':id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.genresService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateGenreDto) {
    return this.genresService.create(user.id, dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MASTER')
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGenreDto) {
    return this.genresService.update(id, dto as any);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.genresService.delete(id);
  }

  // ── Versions ────────────────────────────────────────────────────────────────

  @Get(':id/versions')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  listVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.genresService.listVersions(id);
  }

  @Post(':id/versions')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateVersionDto,
  ) {
    return this.genresService.addVersion(id, user.id, dto.content, dto.note);
  }

  @Get(':id/versions/:versionId')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.genresService.findVersion(id, versionId);
  }

  @Get(':id/versions/:versionId/diff')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  diffVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.genresService.diffVersion(id, versionId);
  }

  @Post(':id/restore/:versionId')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  restoreVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.genresService.restoreVersion(id, versionId, user.id);
  }

  @Post(':id/test')
  @Roles('ADMIN', 'MASTER')
  testTranslation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TestGenreDto,
  ) {
    return this.genresService.testTranslation(id, dto.sampleText);
  }
}

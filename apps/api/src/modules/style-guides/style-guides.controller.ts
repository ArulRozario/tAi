import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { StyleGuidesService } from './style-guides.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

export class CreateStyleGuideDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() icon?: string;
  @IsString() @IsOptional() color?: string;
  @IsString() @IsOptional() segmentUnit?: string;
  @IsString() @IsOptional() content?: string;
}

export class UpdateStyleGuideDto {
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

export class TestStyleGuideDto {
  @IsString() @IsNotEmpty() sampleText!: string;
}

@Controller('style-guides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StyleGuidesController {
  constructor(
    private readonly styleGuidesService: StyleGuidesService,
  ) {}

  @Get()
  @Public()
  findAll(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.styleGuidesService.findAll(q, limit ? parseInt(limit, 10) : undefined);
  }

  @Get(':id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.styleGuidesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateStyleGuideDto) {
    return this.styleGuidesService.create(user.id, dto as any);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MASTER')
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStyleGuideDto) {
    return this.styleGuidesService.update(id, dto as any);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.styleGuidesService.delete(id);
  }

  @Get(':id/versions')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  listVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.styleGuidesService.listVersions(id);
  }

  @Post(':id/versions')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateVersionDto,
  ) {
    return this.styleGuidesService.addVersion(id, user.id, dto.content, dto.note);
  }

  @Get(':id/versions/:versionId')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.styleGuidesService.findVersion(id, versionId);
  }

  @Get(':id/versions/:versionId/diff')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  diffVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.styleGuidesService.diffVersion(id, versionId);
  }

  @Post(':id/restore/:versionId')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  restoreVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.styleGuidesService.restoreVersion(id, versionId, user.id);
  }

  @Post(':id/test')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  testTranslation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TestStyleGuideDto,
  ) {
    return this.styleGuidesService.testTranslation(id, dto.sampleText);
  }
}


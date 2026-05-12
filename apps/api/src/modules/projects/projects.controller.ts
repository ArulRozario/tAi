import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateChapterDto } from './dto/chapter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { MinIOService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly minio: MinIOService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Creates a new translation project.
   * Authorized: ADMIN, MASTER (MASTER+ tier).
   */
  @Post()
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: { id: string },
    @Body() createProjectDto: CreateProjectDto
  ) {
    return this.projectsService.create(user.id, createProjectDto);
  }

  /**
   * Retrieves paginated list of all projects.
   * Authorized: ADMIN, MASTER, REVIEWER (REVIEWER+ tier).
   */
  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.projectsService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * Retrieves single project detail by ID.
   * Authorized: ADMIN, MASTER, REVIEWER (REVIEWER+ tier).
   */
  @Get(':id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  /**
   * Modifies project properties (PATCH specification).
   * Authorized: ADMIN, MASTER (MASTER+ tier).
   */
  @Patch(':id')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  /**
   * Removes a project administratively.
   * Authorized: ADMIN only.
   */
  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }

  /**
   * Retrieves all chapters attached to a project.
   * Authorized: ADMIN, MASTER, REVIEWER (REVIEWER+ tier).
   */
  @Get(':id/chapters')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  findAllChapters(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findAllChapters(id);
  }

  /**
   * Adds a new chapter to a project.
   * Authorized: ADMIN, MASTER (MASTER+ tier).
   */
  @Post(':id/chapters')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  createChapter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createChapterDto: CreateChapterDto
  ) {
    return this.projectsService.createChapter(
      id,
      createChapterDto.chapterNumber,
      createChapterDto.title
    );
  }

  /**
   * Retrieves all glossary cards/terms associated with a project's Genre.
   * Authorized: ADMIN, MASTER, REVIEWER (REVIEWER+ tier).
   */
  @Get(':id/glossary')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  findGlossaryTerms(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findGlossaryTerms(id);
  }

  /**
   * Aggregates stats about all pages currently attached to a project.
   * Authorized: ADMIN, MASTER, REVIEWER (REVIEWER+ tier).
   */
  @Get(':id/stats')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getStats(id);
  }

  /**
   * Pauses all queued extraction/translation jobs for the project.
   * Authorized: ADMIN, MASTER (MASTER+ tier).
   */
  @Post(':id/pause')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async pause(@Param('id', ParseUUIDPipe) id: string) {
    await this.projectsService.pause(id);
  }

  /**
   * Resumes all paused extraction/translation jobs for the project.
   * Authorized: ADMIN, MASTER (MASTER+ tier).
   */
  @Post(':id/resume')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resume(@Param('id', ParseUUIDPipe) id: string) {
    await this.projectsService.resume(id);
  }

  /**
   * Cancels all pending/queued/paused jobs for the project.
   * Authorized: ADMIN, MASTER (MASTER+ tier).
   */
  @Post(':id/cancel-jobs')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelJobs(@Param('id', ParseUUIDPipe) id: string) {
    await this.projectsService.cancelJobs(id);
  }

  /**
   * Runs AI review on all translated pages in the project.
   * Reviews pages in batches and creates/updates Error records per segment.
   * Authorized: ADMIN, MASTER, REVIEWER.
   */
  @Post(':id/review')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.ACCEPTED)
  async reviewProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { modelOverride?: string },
  ) {
    const job = await this.projectsService.enqueueReview(id, body.modelOverride);
    return { jobId: job.id, message: 'AI review queued for project pages.' };
  }

  /**
   * Streams the page image from MinIO for a given project + page number.
   * Auth via ?token= query param (native <img> and EventSource cannot send headers).
   */
  @Get(':id/pages/:pageNum/image')
  async getPageImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('pageNum', ParseIntPipe) pageNum: number,
    @Res() res: Response,
  ) {
    const objectKey = `projects/${id}/pages/${pageNum}.png`;
    try {
      const buffer = await this.minio.downloadFile(objectKey);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.send(buffer);
    } catch {
      throw new NotFoundException(`Page image not found for page ${pageNum}`);
    }
  }
}
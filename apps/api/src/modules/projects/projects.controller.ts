import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateChapterDto } from './dto/chapter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
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
}
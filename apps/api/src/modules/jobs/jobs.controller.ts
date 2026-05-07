import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/job.dto';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * Manually enqueues a background job.
   * Allowed: Any authenticated user role (REVIEWER, MASTER, ADMIN).
   */
  @Post()
  @Roles('REVIEWER', 'MASTER', 'ADMIN')
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.enqueue({
      type: createJobDto.type,
      projectId: createJobDto.projectId,
      pageId: createJobDto.pageId,
      payload: createJobDto.payload || {},
    });
  }

  /**
   * Retrieves detail for a single job by ID.
   * Allowed: Any authenticated user role (REVIEWER, MASTER, ADMIN).
   */
  @Get(':id')
  @Roles('REVIEWER', 'MASTER', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.jobsService.get(id);
  }

  /**
   * Cancels a queued or currently running job gracefully.
   * Allowed: Management roles (MASTER, ADMIN).
   */
  @Delete(':id')
  @Roles('MASTER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.jobsService.cancel(id);
  }
}

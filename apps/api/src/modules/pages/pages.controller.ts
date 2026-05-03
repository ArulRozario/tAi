import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('project/:projectId')
  findByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.pagesService.findByProject(
      projectId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('queue')
  getQueue(
    @Query('reviewerId') reviewerId?: string,
    @Query('priority') priority?: string,
    @Query('limit') limit: string = '20',
  ) {
    return this.pagesService.getQueue(
      reviewerId,
      priority,
      parseInt(limit, 10),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.pagesService.updateStatus(id, status as any);
  }

  @Put(':id/reassign')
  reassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reviewerId') reviewerId: string | null,
  ) {
    return this.pagesService.reassign(id, reviewerId);
  }
}
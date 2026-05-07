import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('pages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findByFilters(
    @Query('projectId') projectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('status') status?: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return this.pagesService.findByFilters({
      projectId,
      chapterId,
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string; priority?: string; status?: string },
  ) {
    return this.pagesService.updatePage(id, body);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.pagesService.approve(id, body, user);
  }

  @Post(':id/request-changes')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  requestChanges(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note: string,
    @CurrentUser() user: any,
  ) {
    return this.pagesService.requestChanges(id, note, user);
  }

  @Post(':id/reassign')
  @Roles('ADMIN', 'MASTER')
  reassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reviewerIds') reviewerIds: string[],
  ) {
    return this.pagesService.reassignPage(id, reviewerIds);
  }

  @Post(':id/add-reviewer')
  @Roles('ADMIN', 'MASTER')
  addReviewer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reviewerId', ParseUUIDPipe) reviewerId: string,
  ) {
    return this.pagesService.addReviewer(id, reviewerId);
  }

  @Post(':id/remove-reviewer')
  @Roles('ADMIN', 'MASTER')
  removeReviewer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reviewerId', ParseUUIDPipe) reviewerId: string,
  ) {
    return this.pagesService.removeReviewer(id, reviewerId);
  }

  @Post(':id/escalate')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  escalate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.pagesService.escalate(id, reason, user);
  }

  @Post(':id/resolve-escalation')
  @Roles('ADMIN', 'MASTER')
  resolveEscalation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('resolution') resolution: string,
  ) {
    return this.pagesService.resolveEscalation(id, resolution);
  }

  @Get(':id/next-in-queue')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  nextInQueue(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.pagesService.nextInQueue(id, user);
  }
}
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('queue')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  getQueue(
    @CurrentUser() user: { id: string },
    @Query('sort') sort?: 'priority' | 'waitTime' | 'quality',
    @Query('errorTypes') errorTypes?: string,
    @Query('reviewerId') reviewerId?: string,
    @Query('lowQualityOnly') lowQualityOnly?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    return this.queueService.getQueue({
      sort,
      errorTypes: errorTypes ? errorTypes.split(',') : undefined,
      reviewerId,
      userId: user.id,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      lowQualityOnly: lowQualityOnly === 'true',
    });
  }

  @Get('queue/submitted')
  @Roles('ADMIN', 'MASTER')
  getSubmittedReviews(
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    return this.queueService.getSubmittedReviews({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  }

  @Get('queue/error-stats')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  getErrorStats() {
    return this.queueService.getErrorStats();
  }

  @Get('escalations')
  @Roles('ADMIN', 'MASTER')
  getEscalations() {
    return this.queueService.getEscalations();
  }
}

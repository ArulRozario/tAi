import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MASTER', 'REVIEWER')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getStats(user.id);
  }

  @Get('throughput')
  getThroughput(
    @Query('metric') metric: 'pages' | 'words' = 'pages',
    @Query('weeks') weeks: string = '12',
  ) {
    return this.dashboardService.getThroughput(metric, parseInt(weeks, 10));
  }

  @Get('my-queue')
  getMyQueue(
    @CurrentUser() user: { id: string },
    @Query('limit') limit: string = '5',
  ) {
    return this.dashboardService.getMyQueue(user.id, parseInt(limit, 10));
  }

  @Get('recent-projects')
  getRecentProjects(@Query('limit') limit: string = '4') {
    return this.dashboardService.getRecentProjects(parseInt(limit, 10));
  }

  @Get('activity')
  getActivity(@Query('limit') limit: string = '10') {
    return this.dashboardService.getActivity(parseInt(limit, 10));
  }
}

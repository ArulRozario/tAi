import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MASTER')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pages')
  getPages(
    @Query('projectId') projectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('status') status?: string,
    @Query('reviewerId') reviewerId?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    return this.adminService.getPages({
      projectId,
      chapterId,
      status,
      reviewerId,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  }

  @Post('bulk-reassign')
  bulkReassign(@Body() body: { pageIds: string[]; reviewerId: string }) {
    return this.adminService.bulkReassign(body.pageIds, body.reviewerId);
  }

  @Post('bulk-approve')
  bulkApprove(@Body() body: { pageIds: string[] }) {
    return this.adminService.bulkApprove(body.pageIds);
  }

  @Post('pages/:id/override')
  overridePage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; reason: string },
  ) {
    return this.adminService.overridePage(id, body.status, body.reason);
  }
}

import { Controller, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('project/:id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  enqueueProjectExport(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() body: { format?: 'pdf' | 'docx' | 'text' | 'html'; scope?: 'all' | 'approved' },
  ) {
    return this.exportService.enqueueProjectExport(projectId, body.format ?? 'text', body.scope ?? 'approved');
  }

  @Post('page/:id/report')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  enqueuePageReport(@Param('id', ParseUUIDPipe) pageId: string) {
    return this.exportService.enqueuePageReport(pageId);
  }

  @Post('admin-report')
  @Roles('ADMIN', 'MASTER')
  enqueueAdminReport(
    @Body() body: { projectIds?: string[]; format?: 'pdf' | 'xlsx' },
  ) {
    return this.exportService.enqueueAdminReport(body.projectIds, body.format ?? 'pdf');
  }
}

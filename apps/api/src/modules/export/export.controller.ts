import { Controller, Get, Param, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('project/:id')
  async exportProject(
    @Param('id') projectId: string,
    @Query('format') format: 'text' | 'html' = 'html',
    @Res() res: Response,
  ) {
    try {
      const result = await this.exportService.exportProject(projectId, format);
      const content = result as string;
      const isHtml = format === 'html';
      const filename = `translation_export.${isHtml ? 'html' : 'txt'}`;
      
      res.setHeader('Content-Type', isHtml ? 'text/html' : 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
  }
}
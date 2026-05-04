import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { RulesService } from './rules.service';

@Controller('rules')
export class RulesController {
  constructor(private rulesService: RulesService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.rulesService.findAll(projectId);
  }

  @Post()
  create(@Body() data: { name: string; content: string; category: string; priority?: number; description?: string }) {
    return this.rulesService.create(data as any);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: { name?: string; content?: string; category?: string; priority?: number; description?: string }) {
    return this.rulesService.update(id, data as any);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.rulesService.delete(id);
  }

  @Post('override')
  createOverride(@Body() data: { projectId: string; ruleId: string; overrideContent: string; isActive: boolean }) {
    return this.rulesService.createOverride(data.projectId, data.ruleId, data.overrideContent, data.isActive);
  }
}
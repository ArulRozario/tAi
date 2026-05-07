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
  BadRequestException,
} from '@nestjs/common';
import { SentencesService } from './sentences.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('sentences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SentencesController {
  constructor(private readonly sentencesService: SentencesService) {}

  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findByPage(@Query('pageId', ParseUUIDPipe) pageId: string) {
    if (!pageId) {
      throw new BadRequestException('pageId query parameter is required');
    }
    return this.sentencesService.findByPage(pageId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { translatedText?: string; isApproved?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.sentencesService.update(id, body, user);
  }

  @Post(':id/apply-all-fixes')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  applyAllFixes(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.sentencesService.applyAllFixes(id, user);
  }

  @Post(':id/assign')
  @Roles('ADMIN', 'MASTER')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reviewerId') reviewerId: string | null,
  ) {
    return this.sentencesService.assign(id, reviewerId);
  }

  @Post(':id/reset-translation')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  resetTranslation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.sentencesService.resetTranslation(id, user);
  }
}

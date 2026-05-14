import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
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
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
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
  @Roles('ADMIN', 'MASTER')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.pagesService.approve(id, body, user);
  }

  @Post('bulk/assign')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  bulkAssign(
    @Body() body: { pageIds: string[]; reviewerId: string },
  ) {
    return this.pagesService.bulkAssign(body.pageIds, body.reviewerId);
  }

  @Post('bulk/unassign')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  bulkUnassign(
    @Body() body: { pageIds: string[]; reviewerId: string },
  ) {
    return this.pagesService.bulkUnassign(body.pageIds, body.reviewerId);
  }

  @Post('bulk/reassign')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  bulkReassign(
    @Body() body: { pageIds: string[]; reviewerIds: string[] },
  ) {
    return this.pagesService.bulkReassign(body.pageIds, body.reviewerIds);
  }

  @Post(':id/submit')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  submitForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.pagesService.submitForReview(id, user);
  }

  @Post(':id/unsubmit')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  unsubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.pagesService.unsubmit(id, user);
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

  /**
   * Runs AI review on a single page.
   * Creates/updates Error records per segment.
   * Authorized: ADMIN, MASTER, REVIEWER.
   */
  @Post(':id/review')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  async reviewPage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() body: { modelOverride?: string },
  ) {
    return this.pagesService.reviewPage(id, user, body?.modelOverride);
  }

  // ── Workbench endpoints ──────────────────────────────────────────────

  @Get(':id/siblings')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async getSiblings(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.getSiblings(id);
  }

  @Post(':id/replace-image')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async replaceImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.pagesService.replaceImage(id);
  }

  @Post(':id/retranslate')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async retranslatePage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { modelOverride?: string },
    @CurrentUser() user: any,
  ) {
    return this.pagesService.retranslatePage(id, body.modelOverride, user);
  }

  @Get(':id/edits')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async getEdits(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.getEdits(id);
  }

  @Post(':id/edits')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.CREATED)
  async saveEdit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { segmentId: string; editedText: string },
    @CurrentUser() user: any,
  ) {
    return this.pagesService.saveEdit(id, body.segmentId, body.editedText, user);
  }

  @Delete(':id/edits/:segmentId')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetEdit(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('segmentId') segmentId: string,
  ) {
    await this.pagesService.resetEdit(id, segmentId);
  }

  @Delete(':id/edits')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  async resetAllEdits(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.resetAllEdits(id);
  }

  // ── Segment retranslation ────────────────────────────────────────────

  @Post(':id/segments/:segmentId/retranslate')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async retranslateSegment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('segmentId') segmentId: string,
    @Body() body: { prompt?: string; modelOverride?: string },
    @CurrentUser() user: any,
  ) {
    return this.pagesService.retranslateSegment(id, segmentId, body.prompt, body.modelOverride, user);
  }
}
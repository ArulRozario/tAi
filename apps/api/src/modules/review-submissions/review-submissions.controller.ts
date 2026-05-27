import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ReviewSubmissionsService } from './review-submissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ApproveSubmissionDto } from './dto/approve-submission.dto';
import { RejectSubmissionDto } from './dto/reject-submission.dto';

@Controller('pages/:pageId/review-submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewSubmissionsController {
  constructor(private readonly reviewSubmissionsService: ReviewSubmissionsService) {}

  @Post()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Body() body: CreateSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewSubmissionsService.submit(pageId, user, body.notes);
  }

  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async findByPage(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    return this.reviewSubmissionsService.findByPage(pageId, user, status);
  }

  @Get('segment/:segmentId')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async findBySegment(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Param('segmentId') segmentId: string,
    @CurrentUser() user: any,
  ) {
    if (!segmentId) throw new BadRequestException('segmentId is required');
    return this.reviewSubmissionsService.findBySegment(pageId, segmentId, user);
  }

  @Post(':submissionId/approve')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() body: ApproveSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewSubmissionsService.approve(pageId, submissionId, user, body.notes);
  }

  @Post(':submissionId/reject')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() body: RejectSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewSubmissionsService.reject(pageId, submissionId, user, body.reason);
  }

  @Post(':submissionId/unsubmit')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  async unsubmit(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @CurrentUser() user: any,
  ) {
    return this.reviewSubmissionsService.unsubmit(pageId, submissionId, user);
  }
}

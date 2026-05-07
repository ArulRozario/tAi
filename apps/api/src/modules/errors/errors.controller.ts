import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ErrorsService } from './errors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('errors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ErrorsController {
  constructor(private readonly errorsService: ErrorsService) {}

  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findMany(
    @Query('pageId') pageId?: string,
    @Query('status') status?: string,
  ) {
    return this.errorsService.findMany({ pageId, status });
  }

  @Post(':id/apply')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  apply(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.errorsService.apply(id, user);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.errorsService.reject(id);
  }

  @Post(':id/exception')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  exception(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { sourceTerm?: string; note?: string },
  ) {
    return this.errorsService.exception(id, body);
  }

  @Post(':id/escalate')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  escalate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.errorsService.escalate(id, body, user);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Observable } from 'rxjs';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async streamDirect(
    @Body() body: any,
    @CurrentUser() user: any,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();
    await this.chatService.streamDirect(body, res);
  }

  @Get('sessions')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findSessions(
    @CurrentUser() user: any,
    @Query('context') context?: string,
    @Query('entityId') entityId?: string
  ) {
    return this.chatService.findSessions(user.id, { context, entityId });
  }

  @Post('sessions')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  createSession(
    @CurrentUser() user: any,
    @Body()
    body: {
      context: string;
      entityId?: string;
      modelProvider?: string;
      modelName?: string;
    }
  ) {
    return this.chatService.createSession(user.id, body);
  }

  @Get('sessions/:id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findSession(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any
  ) {
    return this.chatService.findSession(id, user.id);
  }

  @Delete('sessions/:id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any
  ) {
    await this.chatService.removeSession(id, user.id);
  }

  @Post('sessions/:id/messages')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { content: string; mode?: string },
    @CurrentUser() user: any
  ) {
    return this.chatService.addMessage(id, user.id, body);
  }

  @Sse('sessions/:id/stream')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  stream(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('content') content: string,
    @Query('mode') mode: string,
    @CurrentUser() user: any
  ): Promise<Observable<MessageEvent>> {
    return this.chatService.streamResponse(id, user.id, { content, mode });
  }

  @Get('quick-prompts')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  getQuickPrompts(
    @Query('context') context: string,
    @Query('mode') mode?: string
  ) {
    return this.chatService.getQuickPrompts(context, mode);
  }
}

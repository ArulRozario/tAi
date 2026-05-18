import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { MinIOService } from './minio.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { Response } from 'express';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly minioService: MinIOService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Uploads a file without a project context.
   * Authorized: ADMIN, MASTER (MASTER+ tier).
   */
  @Post('files/upload')
  @Roles('ADMIN', 'MASTER')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFileGeneral(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Multi-part field "file" is required in request body.');
    }

    return this.filesService.uploadGeneralFile(
      file.originalname,
      file.buffer,
      file.mimetype,
    );
  }

  /**
   * Uploads a file for a specific project.
   * Authorized: ADMIN, MASTER (MASTER+ tier).
   */
  @Post('projects/:id/files')
  @Roles('ADMIN', 'MASTER')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @Param('id', ParseUUIDPipe) projectId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Multi-part field "file" is required in request body.');
    }

    return this.filesService.uploadProjectFile(
      projectId,
      file.originalname,
      file.buffer,
      file.mimetype,
    );
  }

  /**
   * Lists all files attached under a specific project.
   * Authorized: ADMIN, MASTER, REVIEWER (REVIEWER+ tier).
   */
  @Get('projects/:id/files')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  async listFiles(@Param('id', ParseUUIDPipe) projectId: string) {
    return this.filesService.listProjectFiles(projectId);
  }

  @Public()
  @Get('files/avatars/:userId')
  async serveAvatar(@Param('userId') userId: string, @Res() res: Response) {
    const key = await this.authService.getAvatarKey(userId);
    if (!key) {
      return res.status(404).end();
    }
    try {
      const buffer = await this.minioService.downloadFile(key);
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      });
      return res.send(buffer);
    } catch {
      return res.status(404).end();
    }
  }

  /**
   * Wildcard route to retrieve files by key and redirect to direct MinIO download URLs.
   * Handles paths with delimiters natively (e.g. GET /files/projects/UUID/filename.pdf).
   * Authorized: ADMIN, MASTER, REVIEWER (REVIEWER+ tier).
   */
  @Get('files/*')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async downloadFile(
    @Param('0') key: string,
    @Res() res: Response,
  ) {
    if (!key) {
      throw new BadRequestException('File key path is missing.');
    }

    // 1. Resolve direct public-access URL to MinIO
    const downloadUrl = this.filesService.getFileUrl(key);

    // 2. Execute direct redirect redirecting client to the object path
    return res.redirect(HttpStatus.FOUND, downloadUrl);
  }
}

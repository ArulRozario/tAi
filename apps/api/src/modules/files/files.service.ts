import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { MinIOService } from './minio.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly minioService: MinIOService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Uploads a file to a general uploads directory in MinIO.
   */
  async uploadGeneralFile(filename: string, buffer: Buffer, contentType: string) {
    const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    try {
      const url = await this.minioService.uploadBuffer(buffer, key, contentType);
      this.logger.log(`File uploaded: ${key} (${buffer.length} bytes)`);
      return { fileId: key, filename, size: buffer.length, url };
    } catch (err) {
      this.logger.error(`Failed to upload file '${filename}': ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Uploads a file for a specific project.
   * If the project has no sourceFileId yet, automatically assigns this uploaded key.
   */
  async uploadProjectFile(
    projectId: string,
    filename: string,
    buffer: Buffer,
    contentType: string,
  ) {
    // 1. Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    // 2. Generate key and upload to MinIO
    const key = this.minioService.generateKey(projectId, filename);
    try {
      await this.minioService.uploadBuffer(buffer, key, contentType);
    } catch (err) {
      this.logger.error(`Failed to upload project file '${filename}' for project ${projectId}: ${(err as Error).message}`);
      throw err;
    }

    // 3. Auto-link source document if empty
    if (!project.sourceFileId) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: { sourceFileId: key },
      });
    }

    this.logger.log(`Project file uploaded: ${key} (${buffer.length} bytes) for project ${projectId}`);
    return {
      id: key,
      name: filename,
      size: buffer.length,
      createdAt: new Date(),
    };
  }

  /**
   * Lists all files uploaded for a specific project.
   */
  async listProjectFiles(projectId: string) {
    // 1. Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    // 2. Retrieve all files in bucket matching "projects/:id/" prefix
    const prefix = `projects/${projectId}/`;
    return this.minioService.listFiles(prefix);
  }

  /**
   * Downloads a file's raw content buffer.
   */
  async downloadFile(key: string): Promise<Buffer> {
    return this.minioService.downloadFile(key);
  }

  /**
   * Generates a direct URL for a given object key.
   */
  getFileUrl(key: string): string {
    return this.minioService.getFileUrl(key);
  }
}

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

/**
 * Generic S3-compatible storage service.
 *
 * Works with:
 *   - Cloudflare R2  (STORAGE_REGION=auto, STORAGE_ENDPOINT=https://<id>.r2.cloudflarestorage.com)
 *   - MinIO           (STORAGE_REGION=us-east-1, STORAGE_ENDPOINT=http://minio:9000)
 *   - AWS S3          (omit STORAGE_ENDPOINT entirely)
 *
 * Required env vars:
 *   STORAGE_ENDPOINT    – full base URL of the S3-compatible service
 *   STORAGE_REGION      – region string (use "auto" for Cloudflare R2)
 *   STORAGE_ACCESS_KEY  – access key / account ID
 *   STORAGE_SECRET_KEY  – secret key
 *   STORAGE_BUCKET      – bucket name
 *   STORAGE_PUBLIC_URL  – public base URL for serving files
 *                         e.g. https://pub-xxx.r2.dev  or  https://files.yourdomain.com
 */
@Injectable()
export class MinIOService implements OnModuleInit {
  private readonly logger = new Logger(MinIOService.name);
  private s3Client!: S3Client;
  private bucket!: string;
  private publicBaseUrl!: string;

  async onModuleInit() {
    const endpoint   = process.env.STORAGE_ENDPOINT;
    const region     = process.env.STORAGE_REGION     || 'auto';
    const accessKey  = process.env.STORAGE_ACCESS_KEY || '';
    const secretKey  = process.env.STORAGE_SECRET_KEY || '';
    this.bucket      = process.env.STORAGE_BUCKET     || 'tai-uploads';
    this.publicBaseUrl = (process.env.STORAGE_PUBLIC_URL || '').replace(/\/$/, '');

    if (!endpoint) {
      this.logger.warn('STORAGE_ENDPOINT is not set — file uploads will fail.');
    }
    if (!this.publicBaseUrl) {
      this.logger.warn('STORAGE_PUBLIC_URL is not set — served file URLs will be wrong.');
    }

    this.s3Client = new S3Client({
      ...(endpoint ? { endpoint } : {}),
      region,
      credentials: {
        accessKeyId:     accessKey,
        secretAccessKey: secretKey,
      },
      // Path-style works for both R2 (via account endpoint) and MinIO
      forcePathStyle: true,
    });

    // Verify bucket is reachable (we do NOT auto-create — managed services like R2/Neon
    // require the bucket to be created in the dashboard first)
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Storage bucket "${this.bucket}" is reachable.`);
    } catch (err: any) {
      this.logger.warn(
        `Storage bucket "${this.bucket}" is not reachable: ${err.message}. ` +
        `Create the bucket in your storage provider's dashboard and set STORAGE_BUCKET.`,
      );
    }
  }

  /** Upload a file using multipart upload (recommended for large files). */
  async uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket:      this.bucket,
        Key:         key,
        Body:        file,
        ContentType: contentType,
      },
      queueSize: 4,
    });

    await upload.done();
    return this.getFileUrl(key);
  }

  /** Upload a buffer using a simple PutObject command (for small files). */
  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         key,
        Body:        buffer,
        ContentType: contentType,
      }),
    );
    return this.getFileUrl(key);
  }

  /** Download a file and return it as a Buffer. */
  async downloadFile(key: string): Promise<Buffer> {
    const response = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!response.Body) {
      throw new Error('Empty response body from storage');
    }

    const stream = response.Body as Readable;
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /** Delete a file from storage. */
  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /** Return the public URL for a stored object. */
  getFileUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  /** Generate a unique, safe object key scoped to a project. */
  generateKey(projectId: string, filename: string): string {
    const timestamp  = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `projects/${projectId}/${timestamp}-${safeFilename}`;
  }

  /** List all objects under a given directory prefix. */
  async listFiles(prefix: string) {
    const response = await this.s3Client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );

    if (!response.Contents) return [];

    return response.Contents.map((obj) => {
      const key      = obj.Key!;
      const filename = key.split('/').pop() || key;
      const cleanName = filename.replace(/^\d+-/, ''); // strip timestamp prefix

      return {
        id:        key,
        name:      cleanName,
        size:      obj.Size || 0,
        createdAt: obj.LastModified || new Date(),
      };
    });
  }
}

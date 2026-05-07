import { Injectable, OnModuleInit } from '@nestjs/common';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

@Injectable()
export class MinIOService implements OnModuleInit {
  private s3Client!: S3Client;
  private bucket!: string;
  private endpoint!: string;

  async onModuleInit() {
    const endpointHost = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '12002';
    this.endpoint = `${endpointHost}:${port}`;
    this.bucket = process.env.MINIO_BUCKET || 'tai-docs';
    
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';

    this.s3Client = new S3Client({
      endpoint: `http://${this.endpoint}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });

    // Ensure bucket exists on start (Auto-Healing)
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (err) {
      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        console.log(`[MinIO] Successfully created bucket: ${this.bucket}`);
      } catch (createErr: any) {
        console.error(`[MinIO] Failed to create bucket '${this.bucket}':`, createErr.message);
      }
    }
  }

  /**
   * Uploads a file buffer/readable to MinIO.
   */
  async uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
    const parallelUploads3 = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      },
      queueSize: 4,
    });

    await parallelUploads3.done();
    return this.getFileUrl(key);
  }

  /**
   * Uploads a raw buffer to MinIO using simple PutObject.
   */
  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getFileUrl(key);
  }

  /**
   * Downloads a file from MinIO as a buffer.
   */
  async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response body');
    }

    const stream = response.Body as Readable;
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  /**
   * Deletes a file from MinIO.
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Returns direct public URL for a file.
   */
  getFileUrl(key: string): string {
    return `http://${this.endpoint}/${this.bucket}/${key}`;
  }

  /**
   * Generates a unique safe object key inside a project folder.
   */
  generateKey(projectId: string, filename: string): string {
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `projects/${projectId}/${timestamp}-${safeFilename}`;
  }

  /**
   * Lists all objects under a given directory prefix.
   */
  async listFiles(prefix: string) {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);
    if (!response.Contents) {
      return [];
    }

    return response.Contents.map((obj) => {
      const key = obj.Key!;
      const filename = key.split('/').pop() || key;
      const cleanName = filename.replace(/^\d+-/, ''); // strip prepended timestamp

      return {
        id: key,
        name: cleanName,
        size: obj.Size || 0,
        createdAt: obj.LastModified || new Date(),
      };
    });
  }
}
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';

let postgresContainer: StartedPostgreSqlContainer;
let minioContainer: StartedMinioContainer;

export interface TestContainerConfig {
  databaseUrl: string;
  minio: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
}

export async function startTestContainers(): Promise<TestContainerConfig> {
  console.log('🚀 Starting PostgreSQL container...');
  postgresContainer = await new PostgreSqlContainer('pgvector/pgvector:pg17')
    .withDatabase('tai_test')
    .withUsername('tai')
    .withPassword('tai123')
    .withReuse()
    .start();

  console.log('🚀 Starting MinIO container...');
  minioContainer = await new MinioContainer('minio/minio:RELEASE.2024-01-16T16-07-38Z')
    .withEnvironment({
      MINIO_ROOT_USER: 'minioadmin',
      MINIO_ROOT_PASSWORD: 'minioadmin',
    })
    .withReuse()
    .start();

  console.log('✅ Test containers started successfully');

  return {
    databaseUrl: postgresContainer.getConnectionUri(),
    minio: {
      endpoint: minioContainer.getHost(),
      port: minioContainer.getPort(),
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      bucket: 'tai-docs',
    },
  };
}

export async function stopTestContainers(): Promise<void> {
  console.log('🛑 Stopping test containers...');
  await minioContainer?.stop();
  await postgresContainer?.stop();
  console.log('✅ Test containers stopped');
}
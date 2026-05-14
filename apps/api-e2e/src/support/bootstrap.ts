import { Test } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../api/src/app/app.module';
import { MinIOService } from '../../../api/src/modules/files/minio.service';
import { ModelsService } from '../../../api/src/modules/models/models.service';
import { GeminiService } from '../../../api/src/modules/agents/gemini.service';
import { OllamaService } from '../../../api/src/modules/agents/ollama.service';
import { AgentType } from '@prisma/client';

let cachedApp: INestApplication | null = null;

declare global {
  namespace NodeJS {
    interface Global {
      app: INestApplication;
      databaseUrl: string;
      minioConfig: {
        endpoint: string;
        port: number;
        accessKey: string;
        secretKey: string;
        bucket: string;
      };
    }
  }
}

export async function createTestApp(): Promise<INestApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const fs = require('fs');
  const path = require('path');
  const configPath = path.join('/tmp/opencode', 'api-e2e-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    process.env.DATABASE_URL = config.databaseUrl;
    process.env.MINIO_ENDPOINT = config.minio.endpoint;
    process.env.MINIO_PORT = String(config.minio.port);
    process.env.MINIO_ACCESS_KEY = config.minio.accessKey;
    process.env.MINIO_SECRET_KEY = config.minio.secretKey;
    process.env.MINIO_BUCKET = config.minio.bucket;
  }

  // Load API key for Gemini tests
  const envPath = path.join('apps/api', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const geminiKeyMatch = envContent.match(/^GEMINI_API_KEY="?([^"\n\r]+)"?$/m);
    if (geminiKeyMatch) {
      process.env.GEMINI_API_KEY = geminiKeyMatch[1];
    }
  }

  console.log('🔧 Creating test app with config:');
  console.log('  Database:', process.env.DATABASE_URL?.substring(0, 30) + '...');
  console.log('  MinIO:', process.env.MINIO_ENDPOINT, ':', process.env.MINIO_PORT);

  // Mock MinIOService to avoid AWS SDK dynamic import issues in Jest VM
  const mockMinioService = {
    uploadFile: async (_file: Buffer, key: string) => `http://mock-minio/${key}`,
    uploadBuffer: async (_buffer: Buffer, key: string) => `http://mock-minio/${key}`,
    downloadFile: async (_key: string) => Buffer.from('mock file content'),
    deleteFile: async (_key: string) => {},
    getFileUrl: (key: string) => `http://mock-minio/${key}`,
    getSignedUrl: async (key: string) => ({
      url: `http://mock-minio/${key}?signed=true`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    }),
    generateKey: (projectId: string, filename: string) => {
      const timestamp = Date.now();
      const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      return `projects/${projectId}/${timestamp}-${safeFilename}`;
    },
    listFiles: async (_prefix: string) => [],
    onModuleInit: async () => {},
  };

  // Mock ModelsService to avoid external LLM dependencies in e2e tests
  const mockModelsService = {
    streamPrompt: async function* (
      _agentType: AgentType,
      prompt: string,
      _options?: any
    ) {
      yield `Mock streaming response for: ${prompt?.substring(0, 50) || 'empty prompt'}...`;
    },
    executePrompt: async () => ({ text: 'Mock LLM response', model: 'mock-model' }),
    listConfigs: async () => [
      {
        id: 'mock-1',
        agentType: 'TRANSLATION',
        provider: 'OLLAMA',
        modelName: 'qwen2.5:7b',
        endpoint: null,
        apiKeyEnc: null,
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mock-2',
        agentType: 'CHAT',
        provider: 'OLLAMA',
        modelName: 'qwen2.5:7b',
        endpoint: null,
        apiKeyEnc: null,
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    updateConfig: async (agentType: string, dto: any) => ({
      id: 'mock-updated',
      agentType,
      provider: dto.provider,
      modelName: dto.modelName,
      endpoint: dto.endpoint || null,
      apiKeyEnc: null,
      isActive: true,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    testConnection: async () => ({ online: true, latencyMs: 0 }),
    getAgentLogs: async () => ({ logs: [] }),
    onModuleInit: async () => {},
  };

  // Mock GeminiService to avoid external API calls
  const mockGeminiService = {
    translateBatchVisual: async () => [],
    getEmbedding768: async () => new Array(768).fill(0),
    streamContent: async function* (_prompt: string, _history?: any[], _systemInstruction?: string, _modelOverride?: string) {
      yield 'Mock Gemini streaming response';
    },
    listModels: async () => [],
  };

  // Mock OllamaService to avoid external API calls
  const mockOllamaService = {
    generate: async () => ({ model: 'mock', response: 'Mock Ollama response', done: true }),
    chat: async () => ({ model: 'mock', response: 'Mock Ollama chat', done: true }),
    getEmbedding: async () => new Array(768).fill(0),
    listModels: async () => [],
    testConnection: async () => ({ online: false, latencyMs: 0, modelLoaded: false, error: 'Mock offline' }),
    pullModel: async () => ({ status: 'success' }),
    setDefaultModel: (_model: string) => {},
    generateStream: async function* (_prompt: string, _model?: string, _options?: any) {
      yield 'Mock Ollama streaming response';
    },
    onModuleInit: async () => {},
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MinIOService)
    .useValue(mockMinioService)
    .overrideProvider(ModelsService)
    .useValue(mockModelsService)
    .overrideProvider(GeminiService)
    .useValue(mockGeminiService)
    .overrideProvider(OllamaService)
    .useValue(mockOllamaService)
    .compile();

  const app = moduleRef.createNestApplication();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.init();

  cachedApp = app;
  globalThis.app = app;

  Logger.log('📱 Test application bootstrapped with mocked services', 'Bootstrap');

  return app;
}

export async function closeTestApp(): Promise<void> {
  if (cachedApp) {
    await cachedApp.close();
    cachedApp = null;
  }
}

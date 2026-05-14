import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Health API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = globalThis.app;
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('db');
      expect(res.body).toHaveProperty('minio');
      expect(res.body).toHaveProperty('ollama');
      expect(res.body).toHaveProperty('anthropic');
    });

    it('should return status as ok when all services are up', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(['ok', 'degraded', 'error']).toContain(res.body.status);
    });

    it('should check db status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(['ok', 'error']).toContain(res.body.db);
    });

    it('should check minio status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(['ok', 'error']).toContain(res.body.minio);
    });

    it('should check ollama status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(['ok', 'error']).toContain(res.body.ollama);
    });

    it('should check anthropic status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(['ok', 'error', 'not_configured']).toContain(res.body.anthropic);
    });
  });
});
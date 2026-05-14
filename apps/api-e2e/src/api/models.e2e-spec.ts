import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Models API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = globalThis.app;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@tai.local', password: 'test123' });
    adminToken = adminRes.body.accessToken;
  });

  describe('GET /models', () => {
    it('should list model configs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/models')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('agentType');
      expect(res.body[0]).toHaveProperty('provider');
    });
  });

  describe('GET /models/available', () => {
    it('should get available models for OLLAMA', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/models/available?provider=OLLAMA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get available models for ANTHROPIC', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/models/available?provider=ANTHROPIC')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should require provider parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/models/available')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should reject invalid provider', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/models/available?provider=INVALID')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /models/:agentType', () => {
    it('should update model config', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/models/TRANSLATION')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'OLLAMA',
          modelName: 'qwen2.5:7b',
          endpoint: 'http://localhost:11434',
        });

      expect(res.status).toBe(200);
      expect(res.body.agentType).toBe('TRANSLATION');
    });

    it('should reject invalid agentType', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/models/INVALID')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ provider: 'OLLAMA', modelName: 'test' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /models/test', () => {
    it('should test connection with OLLAMA', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/models/test')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'OLLAMA',
          modelName: 'qwen2.5:7b',
          endpoint: 'http://localhost:11434',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('online');
    });

    it('should test connection with ANTHROPIC', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/models/test')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'ANTHROPIC',
          modelName: 'claude-sonnet-4-6',
          apiKey: 'test-key',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('online');
    });
  });

  describe('GET /models/:agentType/logs', () => {
    it('should get agent logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/models/TRANSLATION/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
    });

    it('should support limit parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/models/TRANSLATION/logs?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject invalid agentType', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/models/INVALID/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});
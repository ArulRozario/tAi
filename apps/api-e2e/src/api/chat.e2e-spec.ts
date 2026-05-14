import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Chat API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let reviewerToken: string;

  beforeAll(async () => {
    app = globalThis.app;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@tai.local', password: 'test123' });
    adminToken = adminRes.body.accessToken;

    const reviewerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reviewer@tai.local', password: 'test123' });
    reviewerToken = reviewerRes.body.accessToken;
  });

  describe('POST /chat', () => {
    it('should stream chat response for general context', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept', 'text/event-stream')
        .send({ context: 'general', prompt: 'Hello' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
    });

    it('should stream chat response for styleGuide context', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept', 'text/event-stream')
        .send({
          context: 'styleGuide',
          entityId: globalThis.styleGuideId,
          prompt: 'Improve the terminology section',
          currentContent: '# Test Style Guide\n\n## Overview\nTest',
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
    });

    it('should reject invalid context', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ context: 'invalid', prompt: 'Hello' });

      expect(res.status).toBe(400);
    });

    it('should require prompt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ context: 'general' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /chat/quick-prompts', () => {
    it('should get quick prompts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/chat/quick-prompts?context=general')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get prompts with mode', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/chat/quick-prompts?context=styleGuide&mode=plan')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});

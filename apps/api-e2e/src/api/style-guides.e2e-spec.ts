import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Style Guides API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let masterToken: string;
  let reviewerToken: string;
  let styleGuideId: string;

  beforeAll(async () => {
    app = globalThis.app;
    styleGuideId = globalThis.styleGuideId;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@tai.local', password: 'test123' });
    adminToken = adminRes.body.accessToken;

    const masterRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'master@tai.local', password: 'test123' });
    masterToken = masterRes.body.accessToken;

    const reviewerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reviewer@tai.local', password: 'test123' });
    reviewerToken = reviewerRes.body.accessToken;
  });

  describe('GET /style-guides', () => {
    it('should list style guides for ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/style-guides')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should list style guides for REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/style-guides')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
    });

    it('should filter by query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/style-guides?q=Bible')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should support limit parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/style-guides?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /style-guides', () => {
    it('should create style guide as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/style-guides')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          name: 'New StyleGuide',
          description: 'Test description',
          icon: '📚',
          color: '#123456',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New StyleGuide');
    });

    it('should deny create as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/style-guides')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ name: 'Unauthorized StyleGuide' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /style-guides/:id', () => {
    it('should get style guide by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/style-guides/${styleGuideId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(styleGuideId);
      expect(res.body.currentVersion).toBeDefined();
    });
  });

  describe('PATCH /style-guides/:id', () => {
    it('should update style guide as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/style-guides/${styleGuideId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ name: 'Updated StyleGuide Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated StyleGuide Name');
    });

    it('should update segmentUnit', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/style-guides/${styleGuideId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ segmentUnit: 'PAGE' });

      expect(res.status).toBe(200);
      expect(res.body.segmentUnit).toBe('PAGE');
    });
  });

  describe('DELETE /style-guides/:id', () => {
    let testGenreId: string;

    it('should create style guide for deletion test', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/style-guides')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ name: 'StyleGuide to Delete' });
      testGenreId = res.body.id;
    });

    it('should delete style guide as ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/style-guides/${testGenreId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it('should deny delete as MASTER (ADMIN only)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/style-guides')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ name: 'Protected StyleGuide' });
      
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/style-guides/${createRes.body.id}`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /style-guides/:id/versions', () => {
    it('should list versions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/style-guides/${styleGuideId}/versions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /style-guides/:id/versions', () => {
    it('should create new version as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/style-guides/${styleGuideId}/versions`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          content: 'New version content',
          note: 'Test version note',
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('New version content');
    });
  });

  describe('GET /style-guides/:id/versions/:versionId', () => {
    it('should get specific version', async () => {
      const versionsRes = await request(app.getHttpServer())
        .get(`/api/v1/style-guides/${styleGuideId}/versions`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      const versionId = versionsRes.body[0].id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/style-guides/${styleGuideId}/versions/${versionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(versionId);
    });
  });

  describe('POST /style-guides/:id/restore/:versionId', () => {
    it('should restore version as MASTER', async () => {
      const versionsRes = await request(app.getHttpServer())
        .get(`/api/v1/style-guides/${styleGuideId}/versions`)
        .set('Authorization', `Bearer ${masterToken}`);
      
      const versionId = versionsRes.body[versionsRes.body.length - 1]?.id;
      if (!versionId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/style-guides/${styleGuideId}/restore/${versionId}`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
    });
  });

  describe('GET /style-guides/:id/versions/:versionId/diff', () => {
    it('should return diff between versions', async () => {
      const versionsRes = await request(app.getHttpServer())
        .get(`/api/v1/style-guides/${styleGuideId}/versions`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      if (versionsRes.body.length < 2) return;
      const versionId = versionsRes.body[versionsRes.body.length - 1].id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/style-guides/${styleGuideId}/versions/${versionId}/diff`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('diff');
    });
  });

  describe('POST /style-guides/:id/test', () => {
    const testIfGemini = process.env.GEMINI_API_KEY ? it : it.skip;

    testIfGemini('should test translation with Gemini', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/style-guides/${styleGuideId}/test`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ sampleText: 'Hello world' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('translation');
    }, 30000);
  });
});
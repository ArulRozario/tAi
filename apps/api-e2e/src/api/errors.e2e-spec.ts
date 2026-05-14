import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Errors API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let reviewerToken: string;
  let styleGuideId: string;
  let errorId: string;

  beforeAll(async () => {
    app = globalThis.app;
    styleGuideId = globalThis.styleGuideId;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@tai.local', password: 'test123' });
    adminToken = adminRes.body.accessToken;

    const reviewerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reviewer@tai.local', password: 'test123' });
    reviewerToken = reviewerRes.body.accessToken;
  });

  describe('GET /errors', () => {
    it('should list errors', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/errors')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by pageId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/errors?pageId=some-page-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/errors?status=OPEN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /errors/:id/apply', () => {
    it('should apply error fix', async () => {
      if (!errorId) {
        const pagesRes = await request(app.getHttpServer())
          .get('/api/v1/pages')
          .set('Authorization', `Bearer ${adminToken}`);
        
        const errorsRes = await request(app.getHttpServer())
          .get(`/api/v1/errors?pageId=${pagesRes.body[0]?.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        errorId = errorsRes.body[0]?.id;
      }
      if (!errorId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/errors/${errorId}/apply`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /errors/:id/reject', () => {
    it('should reject error', async () => {
      if (!errorId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/errors/${errorId}/reject`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /errors/:id/exception', () => {
    it('should create exception without glossary term', async () => {
      if (!errorId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/errors/${errorId}/exception`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ note: 'Accepted as exception' });

      expect(res.status).toBe(200);
    });

    it('should create exception with glossary term', async () => {
      if (!errorId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/errors/${errorId}/exception`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ 
          sourceTerm: 'Test Term',
          note: 'Adding to glossary',
        });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /errors/:id/escalate', () => {
    it('should escalate error', async () => {
      if (!errorId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/errors/${errorId}/escalate`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ reason: 'Complex issue' });

      expect(res.status).toBe(200);
    });
  });
});
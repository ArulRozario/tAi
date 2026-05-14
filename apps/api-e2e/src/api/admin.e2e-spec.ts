import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Admin API (e2e)', () => {
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

  describe('GET /admin/pages', () => {
    it('should list pages as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pages')
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by projectId', async () => {
      const projectRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Test Project',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/pages?projectId=${projectRes.body.id}`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(200);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pages?status=PENDING')
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(200);
    });

    it('should support pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pages?limit=10&offset=0')
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/pages')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /admin/bulk-reassign', () => {
    it('should bulk reassign pages as MASTER', async () => {
      const pagesRes = await request(app.getHttpServer())
        .get('/api/v1/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      if (!pagesRes.body.data || pagesRes.body.data.length === 0) return;
      
      const pageIds = pagesRes.body.data.slice(0, 2).map((p: any) => p.id);

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/bulk-reassign')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          pageIds,
          reviewerId: globalThis.userIds.reviewer,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('updated');
    });
  });

  describe('POST /admin/bulk-approve', () => {
    it('should bulk approve pages as MASTER', async () => {
      const pagesRes = await request(app.getHttpServer())
        .get('/api/v1/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      if (!pagesRes.body.data || pagesRes.body.data.length === 0) return;
      
      const pageIds = pagesRes.body.data.slice(0, 2).map((p: any) => p.id);

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/bulk-approve')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ pageIds });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('updated');
      expect(res.body).toHaveProperty('skipped');
    });
  });

  describe('POST /admin/pages/:id/override', () => {
    it('should override page status as MASTER', async () => {
      const pagesRes = await request(app.getHttpServer())
        .get('/api/v1/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      if (!pagesRes.body.data || pagesRes.body.data.length === 0) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/pages/${pagesRes.body.data[0].id}/override`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ status: 'APPROVED', reason: 'Manual override' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('APPROVED');
    });
  });
});
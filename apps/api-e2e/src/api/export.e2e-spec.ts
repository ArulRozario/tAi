import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Export API (e2e)', () => {
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

  describe('POST /export/project/:id', () => {
    it('should enqueue project export as REVIEWER', async () => {
      const projectRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Export Test Project',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/export/project/${projectRes.body.id}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ format: 'pdf', scope: 'approved' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('jobId');
    });

    it('should export with text format', async () => {
      const projectRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Export Test Project 2',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/export/project/${projectRes.body.id}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ format: 'text' });

      expect(res.status).toBe(201);
    });

    it('should export with html format', async () => {
      const projectRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Export Test Project 3',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/export/project/${projectRes.body.id}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ format: 'html' });

      expect(res.status).toBe(201);
    });

    it('should export with all scope', async () => {
      const projectRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Export Test Project 4',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/export/project/${projectRes.body.id}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ format: 'pdf', scope: 'all' });

      expect(res.status).toBe(201);
    });
  });

  describe('POST /export/page/:id/report', () => {
    it('should enqueue page report', async () => {
      const pagesRes = await request(app.getHttpServer())
        .get('/api/v1/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      if (!pagesRes.body.data || pagesRes.body.data.length === 0) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/export/page/${pagesRes.body.data[0].id}/report`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('jobId');
    });
  });

  describe('POST /export/admin-report', () => {
    it('should enqueue admin report as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/export/admin-report')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ format: 'pdf' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('jobId');
    });

    it('should enqueue admin report with projectIds', async () => {
      const projectRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Report Project',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      const res = await request(app.getHttpServer())
        .post('/api/v1/export/admin-report')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ projectIds: [projectRes.body.id], format: 'xlsx' });

      expect(res.status).toBe(201);
    });

    it('should deny as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/export/admin-report')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ format: 'pdf' });

      expect(res.status).toBe(403);
    });
  });
});
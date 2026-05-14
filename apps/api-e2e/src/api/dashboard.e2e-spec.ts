import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Dashboard API (e2e)', () => {
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

  describe('GET /dashboard/stats', () => {
    it('should get dashboard stats for ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('activeProjects');
      expect(res.body).toHaveProperty('pagesTranslated');
      expect(res.body).toHaveProperty('pendingReview');
    });

    it('should get dashboard stats for REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /dashboard/throughput', () => {
    it('should get throughput with default metric', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/throughput')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should get throughput with pages metric', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/throughput?metric=pages')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should get throughput with words metric', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/throughput?metric=words')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should support weeks parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/throughput?weeks=6')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /dashboard/my-queue', () => {
    it('should get my queue with default limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/my-queue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get my queue with custom limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/my-queue?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /dashboard/recent-projects', () => {
    it('should get recent projects with default limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get recent projects with custom limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-projects?limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /dashboard/activity', () => {
    it('should get activity with default limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get activity with custom limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/activity?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
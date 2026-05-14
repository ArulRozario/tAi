import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Queue API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let masterToken: string;
  let reviewerToken: string;

  beforeAll(async () => {
    app = globalThis.app;

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

  describe('GET /queue', () => {
    it('should get queue for ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/queue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

    });
  });

  describe('GET /escalations', () => {
    it('should get escalations as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/escalations')
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should deny access as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/escalations')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Chapters API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let masterToken: string;
  let reviewerToken: string;
  let styleGuideId: string;
  let projectId: string;
  let chapterId: string;

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

    const projectRes = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Chapter Test Project',
        styleGuideId,
        sourceLang: 'en',
        targetLang: 'ta',
      });
    projectId = projectRes.body.id;
  });

  describe('GET /projects/:id/chapters', () => {
    it('should list chapters for project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /projects/:id/chapters', () => {
    it('should create chapter as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/chapters`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          chapterNumber: 1,
          title: 'Test Chapter',
        });

      expect(res.status).toBe(201);
      chapterId = res.body.id;
    });

    it('should deny as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/chapters`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ chapterNumber: 2 });

      expect(res.status).toBe(403);
    });
  });
});
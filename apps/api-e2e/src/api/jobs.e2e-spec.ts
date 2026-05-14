import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Jobs API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let masterToken: string;
  let reviewerToken: string;
  let styleGuideId: string;
  let projectId: string;

  beforeAll(async () => {
    app = globalThis.app;
    styleGuideId = globalThis.styleGuideId;
    projectId = globalThis.projectId;

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

  describe('POST /jobs', () => {
    it('should create job as ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'PROCESS_DOCUMENT',
          projectId: projectId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should create job with payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'TRANSLATE_BATCH',
          projectId: projectId,
          payload: { pageIds: ['page1', 'page2'] },
        });

      expect(res.status).toBe(201);
    });

    it('should deny with invalid type', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'INVALID_TYPE',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /jobs/:id', () => {
    it('should get job by id', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'PROCESS_DOCUMENT', projectId: projectId });
      
      const jobId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(jobId);
    });

    it('should return 404 for non-existent job', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/jobs/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /jobs/:id', () => {
    it('should cancel job as MASTER', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'PROCESS_DOCUMENT', projectId: projectId });
      
      const jobId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(204);
    });

    it('should deny delete as REVIEWER', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'PROCESS_DOCUMENT', projectId: projectId });
      
      const jobId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Projects API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let masterToken: string;
  let reviewerToken: string;
  let styleGuideId: string;
  let projectId: string;

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

  describe('GET /projects', () => {
    it('should list projects for ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should list projects for REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
    });

    it('should support pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /projects', () => {
    it('should create project as ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Project',
          description: 'Test description',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Project');
      projectId = res.body.id;
    });

    it('should create project as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          name: 'Reviewer Project',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      expect(res.status).toBe(201);
    });

    it('should reject without styleGuideId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Project',
          sourceLang: 'en',
          targetLang: 'ta',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /projects/:id', () => {
    it('should get project by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(projectId);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('should update project as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ name: 'Updated Project Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Project Name');
    });

    it('should update status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ status: 'DRAFT' });

      expect(res.status).toBe(200);
    });

    it('should deny update as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ name: 'Should Fail' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete project as ADMIN', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Project to Delete',
          styleGuideId,
          sourceLang: 'en',
          targetLang: 'ta',
        });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });

  describe('POST /projects/:id/pause', () => {
    it('should pause project as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/pause`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(204);
    });

    it('should deny as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/pause`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /projects/:id/resume', () => {
    it('should resume project as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/resume`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(204);
    });
  });

  describe('POST /projects/:id/cancel-jobs', () => {
    it('should cancel jobs as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/cancel-jobs`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(204);
    });
  });

  describe('GET /projects/:id/stats', () => {
    it('should get project stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /projects/:id/team', () => {
    it('should get project team', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/team`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reviewers');
    });
  });

  describe('GET /projects/:id/chapters', () => {
    it('should get project chapters', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /projects/:id/chapters', () => {
    it('should create chapter as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/chapters`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          chapterNumber: 1,
          title: 'Chapter One',
        });

      expect(res.status).toBe(201);
    });

    it('should deny as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/chapters`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ chapterNumber: 2 });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /projects/:id/glossary', () => {
    it('should get project glossary', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/glossary`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
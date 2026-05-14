import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Pages API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let masterToken: string;
  let reviewerToken: string;
  let styleGuideId: string;
  let projectId: string;
  let pageId: string;

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
        name: 'Pages Test Project',
        styleGuideId,
        sourceLang: 'en',
        targetLang: 'ta',
      });
    projectId = projectRes.body.id;

    await new Promise(r => setTimeout(r, 3000));

    const pagesRes = await request(app.getHttpServer())
      .get(`/api/v1/pages?projectId=${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    if (pagesRes.body.length > 0) {
      pageId = pagesRes.body[0].id;
    }
  });

  describe('GET /pages', () => {
    it('should list pages for project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/pages?projectId=${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/pages?projectId=${projectId}&status=PENDING`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should support pagination', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/pages?projectId=${projectId}&limit=10&offset=0`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /pages/:id', () => {
    it('should get page by id', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('originalHtml');
    });
  });

  describe('PATCH /pages/:id', () => {
    it('should update page notes', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ notes: 'Test notes' });

      expect(res.status).toBe(200);
    });

    it('should update priority', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ priority: 'HIGH' });

      expect(res.status).toBe(200);
      expect(res.body.priority).toBe('HIGH');
    });
  });

  describe('POST /pages/:id/approve', () => {
    it('should approve page', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Approved' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /pages/:id/request-changes', () => {
    it('should request changes with note', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/request-changes`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ note: 'Changes requested' });

      expect(res.status).toBe(200);
    });

    it('should fail without note', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/request-changes`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ note: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /pages/:id/reassign', () => {
    it('should reassign page as MASTER', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/reassign`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ reviewerIds: [globalThis.userIds.reviewer] });

      expect(res.status).toBe(200);
    });

    it('should deny as REVIEWER', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/reassign`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ reviewerIds: [globalThis.userIds.admin] });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /pages/:id/add-reviewer', () => {
    it('should add reviewer as MASTER', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/add-reviewer`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ reviewerId: globalThis.userIds.master });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /pages/:id/remove-reviewer', () => {
    it('should remove reviewer as MASTER', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/remove-reviewer`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ reviewerId: globalThis.userIds.master });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /pages/:id/escalate', () => {
    it('should escalate page', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/escalate`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ reason: 'Need expert review' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /pages/:id/resolve-escalation', () => {
    it('should resolve escalation as MASTER', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageId}/resolve-escalation`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ resolution: 'Issue resolved' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /pages/:id/next-in-queue', () => {
    it('should get next page in queue', async () => {
      if (!pageId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/pages/${pageId}/next-in-queue`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
    });
  });
});
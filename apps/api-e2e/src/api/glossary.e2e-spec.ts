import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Glossary API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let masterToken: string;
  let reviewerToken: string;
  let styleGuideId: string;
  let glossaryTermId: string;

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

  describe('GET /glossary', () => {
    it('should list glossary terms', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/glossary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by styleGuideId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/glossary?styleGuideId=${styleGuideId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should filter by query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/glossary?q=God')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should support limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/glossary?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /glossary', () => {
    it('should create glossary term as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/glossary')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          styleGuideId,
          sourceTerm: 'Sacred',
          targetTerm: 'புனித',
          context: 'Theological term',
          notes: 'Test note',
        });

      expect(res.status).toBe(201);
      glossaryTermId = res.body.id;
    });

    it('should deny as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/glossary')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          styleGuideId,
          sourceTerm: 'Test',
          targetTerm: 'சோதனை',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /glossary/:id', () => {
    it('should update glossary term as MASTER', async () => {
      if (!glossaryTermId) return;

      const res = await request(app.getHttpServer())
        .put(`/api/v1/glossary/${glossaryTermId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ targetTerm: 'புதிய மொழிபெயர்ப்பு' });

      expect(res.status).toBe(200);
      expect(res.body.targetTerm).toBe('புதிய மொழிபெயர்ப்பு');
    });

    it('should update context', async () => {
      if (!glossaryTermId) return;

      const res = await request(app.getHttpServer())
        .put(`/api/v1/glossary/${glossaryTermId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ context: 'Updated context' });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /glossary/:id', () => {
    it('should delete glossary term as MASTER', async () => {
      if (!glossaryTermId) return;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/glossary/${glossaryTermId}`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(204);
    });

    it('should deny delete as REVIEWER', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/glossary')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({ styleGuideId, sourceTerm: 'ToDelete', targetTerm: 'அழித்தல்' });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/glossary/${createRes.body.id}`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /glossary/bulk', () => {
    it('should bulk create as ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/glossary/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          styleGuideId,
          terms: [
            { sourceTerm: 'Church', targetTerm: 'தேவாலயம்' },
            { sourceTerm: 'Spirit', targetTerm: 'ஆவி' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('created');
    });
  });

  describe('GET /glossary/lookup', () => {
    it('should lookup terms', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/glossary/lookup?term=God&styleGuideId=${styleGuideId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should require term parameter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/glossary/lookup?styleGuideId=${styleGuideId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should require styleGuideId parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/glossary/lookup?term=God')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});
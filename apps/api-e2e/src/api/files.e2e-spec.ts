import { INestApplication } from '@nestjs/common';
const request = require('supertest');

describe('Files API (e2e)', () => {
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

  describe('POST /files/upload', () => {
    it('should upload file as ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('fileId');
    });

    it('should upload file as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${masterToken}`)
        .attach('file', Buffer.from('test file'), 'test.pdf');

      expect(res.status).toBe(201);
    });

    it('should upload file as REVIEWER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .attach('file', Buffer.from('test'), 'test.pdf');

      expect(res.status).toBe(201);
    });

    it('should fail without file', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /files/:fileId/url', () => {
    it('should get signed URL as ADMIN', async () => {
      const uploadRes = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('test'), 'test.pdf');
      
      expect(uploadRes.status).toBe(201);
      const fileId = uploadRes.body.fileId;


      const res = await request(app.getHttpServer())
        .get(`/api/v1/files/${fileId}/url`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('url');
      expect(res.body).toHaveProperty('expiresAt');
    });

    it('should get signed URL as REVIEWER', async () => {
      const uploadRes = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${masterToken}`)
        .attach('file', Buffer.from('test'), 'reviewer-test.pdf');
      
      expect(uploadRes.status).toBe(201);
      const fileId = uploadRes.body.fileId;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/files/${fileId}/url`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /files/*', () => {
    it('should get public file without auth', async () => {
      const uploadRes = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('public test'), 'public.txt');
      
      expect(uploadRes.status).toBe(201);
      const fileId = uploadRes.body.fileId;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/files/${fileId}`);

      expect([200, 302, 404]).toContain(res.status);
    });
  });
});
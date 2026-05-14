import { INestApplication } from '@nestjs/common';
const request = require('supertest');

declare global {
  namespace NodeJS {
    interface Global {
      app: INestApplication;
      adminToken: string;
      masterToken: string;
      reviewerToken: string;
    }
  }
}

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let masterToken = '';
  let reviewerToken = '';

  beforeAll(async () => {
    app = globalThis.app;
    
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@tai.local', password: 'test123' });
    adminToken = adminRes.body.accessToken;
    globalThis.adminToken = adminToken;

    const masterRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'master@tai.local', password: 'test123' });
    masterToken = masterRes.body.accessToken;
    globalThis.masterToken = masterToken;

    const reviewerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reviewer@tai.local', password: 'test123' });
    reviewerToken = reviewerRes.body.accessToken;
    globalThis.reviewerToken = reviewerToken;
  });

  describe('POST /auth/login', () => {
    it('should return tokens with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@tai.local', password: 'test123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toMatchObject({ email: 'admin@tai.local', role: 'ADMIN' });
    });

    it('should return tokens with rememberMe flag', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@tai.local', password: 'test123', rememberMe: true });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should fail with invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@tai.local', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should fail with invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@tai.local', password: 'test123' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should rotate tokens with valid refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@tai.local', password: 'test123' });
      const refreshToken = loginRes.body.refreshToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@tai.local', password: 'test123' });
      const refreshToken = loginRes.body.refreshToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(204);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should accept valid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'admin@tai.local' });

      expect(res.status).toBe(204);
    });

    it('should accept non-existent email without error', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@tai.local' });

      expect(res.status).toBe(204);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should fail with invalid token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'newpass123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with admin token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@tai.local');
      expect(res.body.role).toBe('ADMIN');
    });

    it('should return current user with reviewer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('reviewer@tai.local');
      expect(res.body.role).toBe('REVIEWER');
    });

    it('should fail without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });
  });
});
import { INestApplication } from '@nestjs/common';
const request = require('supertest');

declare global {
  namespace NodeJS {
    interface Global {
      newUserId: string;
    }
  }
}

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let masterToken: string;

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
  });

  describe('GET /users', () => {
    it('should list users for ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should list users for MASTER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny access for REVIEWER', async () => {
      const reviewerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'reviewer@tai.local', password: 'test123' });
      
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${reviewerRes.body.accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /users/invite', () => {
    it('should invite new user as ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
          email: 'newuser@tai.local',
          role: 'REVIEWER',
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('newuser@tai.local');
      globalThis.newUserId = res.body.id;
    });

    it('should reject invite as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/invite')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          name: 'Another User',
          email: 'another@tai.local',
          role: 'REVIEWER',
        });

      expect(res.status).toBe(403);
    });

    it('should reject ADMIN role invitation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin User',
          email: 'admin2@tai.local',
          role: 'ADMIN',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user as ADMIN', async () => {
      if (!globalThis.newUserId) {
        const inviteRes = await request(app.getHttpServer())
          .post('/api/v1/users/invite')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Test User', email: 'testuser@tai.local', role: 'REVIEWER' });
        globalThis.newUserId = inviteRes.body.id;
      }

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${globalThis.newUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    it('should update user role', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${globalThis.newUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'MASTER' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('MASTER');
    });

    it('should toggle user active status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${globalThis.newUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);
    });
  });

  describe('POST /users/:id/reset-password', () => {
    it('should reset password as ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/users/${globalThis.newUserId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it('should deny reset as MASTER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/users/${globalThis.newUserId}/reset-password`)
        .set('Authorization', `Bearer ${masterToken}`);

      expect(res.status).toBe(403);
    });
  });
});
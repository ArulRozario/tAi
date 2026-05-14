import { INestApplication } from '@nestjs/common';

declare global {
  namespace NodeJS {
    interface Global {
      app: INestApplication;
      adminToken: string;
      masterToken: string;
      reviewerToken: string;
      styleGuideId: string;
      newUserId: string;
      userIds: {
        admin: string;
        master: string;
        reviewer: string;
      };
      databaseUrl: string;
      minioConfig: {
        endpoint: string;
        port: number;
        accessKey: string;
        secretKey: string;
        bucket: string;
      };
    }
  }
}

export function getTokens(app: INestApplication): Promise<{ adminToken: string; masterToken: string; reviewerToken: string }> {
  return Promise.all([
    Promise.resolve(require('supertest')(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'admin@tai.local', password: 'test123' })),
    Promise.resolve(require('supertest')(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'master@tai.local', password: 'test123' })),
    Promise.resolve(require('supertest')(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'reviewer@tai.local', password: 'test123' })),
  ]).then(([adminRes, masterRes, reviewerRes]) => ({
    adminToken: adminRes.body.accessToken,
    masterToken: masterRes.body.accessToken,
    reviewerToken: reviewerRes.body.accessToken,
  }));
}

export function adminAuth(): { Authorization: string } {
  return { Authorization: `Bearer ${globalThis.adminToken}` };
}

export function masterAuth(): { Authorization: string } {
  return { Authorization: `Bearer ${globalThis.masterToken}` };
}

export function reviewerAuth(): { Authorization: string } {
  return { Authorization: `Bearer ${globalThis.reviewerToken}` };
}

export async function pollJobUntilDone(
  app: INestApplication,
  jobId: string,
  token: string,
  timeout = 120000
): Promise<void> {
  const request = require('supertest');
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`);
    
    if (res.status === 404) {
      throw new Error('Job not found');
    }
    
    if (res.body.status === 'DONE') {
      return;
    }
    if (res.body.status === 'FAILED') {
      throw new Error(`Job failed: ${res.body.errorMessage}`);
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Job polling timeout');
}

export async function waitForJobType(
  app: INestApplication,
  jobType: string,
  token: string,
  timeout = 30000
): Promise<string> {
  const request = require('supertest');
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await request(app.getHttpServer())
      .get('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`);
    
    const job = res.body.find((j: any) => j.type === jobType && j.status !== 'DONE');
    if (job) {
      return job.id;
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Job of type ${jobType} not found`);
}

export function createMockFile(): Buffer {
  return Buffer.from('Mock PDF content for testing');
}
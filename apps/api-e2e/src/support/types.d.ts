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

declare module 'supertest' {
  export default function supertest(app: any): supertest.SuperTest<supertest.Test>;
  export namespace supertest {
    interface SuperTest<T extends supertest.Test> extends Promise<supertest.Response> {
      get(url: string): T;
      post(url: string): T;
      put(url: string): T;
      patch(url: string): T;
      delete(url: string): T;
      set(field: string, value: string): T;
      send(data: any): T;
      attach(field: string, file: string, options?: any): T;
      field(name: string, value: string): T;
    }
    interface Test extends supertest.SuperTest<supertest.Test> {}
    interface Response {
      status: number;
      body: any;
      text: string;
      headers: Record<string, string>;
    }
  }
}
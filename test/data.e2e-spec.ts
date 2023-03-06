import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataModule } from '../src/data/data.module';

describe('DataController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DataModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/data (GET)', () => {
    it('should return HttpStatus 200 and top story ids', () => {
      return request(app.getHttpServer())
        .get('/data')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('result');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

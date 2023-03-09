import { Test, TestingModule } from '@nestjs/testing';
import { REDIS_CLIENT_NAME } from '../common/constants/redis.constants';
import { BitstampService } from './bitstamp.service';

describe('BitstampService', () => {
  let service: BitstampService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BitstampService,
        {
          provide: REDIS_CLIENT_NAME,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BitstampService>(BitstampService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: add more testing
});

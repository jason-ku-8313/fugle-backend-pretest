import { Module } from '@nestjs/common';
import { RedisClientOptions, createClient } from 'redis';
import {
  REDIS_CLIENT_NAME,
  REDIS_OPTIONS_NAME,
} from '../constants/redis.constants';

@Module({
  providers: [
    {
      provide: REDIS_OPTIONS_NAME,
      useValue: {
        url: 'redis://localhost:6379',
      },
    },
    {
      inject: [REDIS_OPTIONS_NAME],
      provide: REDIS_CLIENT_NAME,
      useFactory: async (options: RedisClientOptions) => {
        const client = createClient(options);
        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT_NAME],
})
export class RedisModule {}

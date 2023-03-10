import { Module } from '@nestjs/common';
import { RedisClientOptions, createClient } from 'redis';
import {
  REDIS_CLIENT,
  REDIS_OPTIONS,
  REDIS_PUBLISHER,
  REDIS_SUBSCRIBER,
} from '../constants/redis.constants';

@Module({
  providers: [
    {
      provide: REDIS_OPTIONS,
      useValue: {
        url: 'redis://localhost:6379',
      },
    },
    {
      inject: [REDIS_OPTIONS],
      provide: REDIS_CLIENT,
      useFactory: async (options: RedisClientOptions) => {
        const client = createClient(options);
        await client.connect();
        return client;
      },
    },
    {
      inject: [REDIS_OPTIONS],
      provide: REDIS_SUBSCRIBER,
      useFactory: async (options: RedisClientOptions) => {
        const client = createClient(options);
        await client.connect();
        return client;
      },
    },
    {
      inject: [REDIS_OPTIONS],
      provide: REDIS_PUBLISHER,
      useFactory: async (options: RedisClientOptions) => {
        const client = createClient(options);
        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT, REDIS_SUBSCRIBER, REDIS_PUBLISHER],
})
export class RedisModule {}

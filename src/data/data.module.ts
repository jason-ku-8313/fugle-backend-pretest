import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RedisClientOptions, createClient } from 'redis';
import { DataController } from './data.controller';
import { DataService } from './data.service';

@Module({
  imports: [HttpModule.register({ timeout: 3000 })],
  controllers: [DataController],
  providers: [
    DataService,
    {
      provide: 'REDIS_OPTIONS',
      useValue: {
        url: 'redis://localhost:6379',
      },
    },
    {
      inject: ['REDIS_OPTIONS'],
      provide: 'REDIS_CLIENT',
      useFactory: async (options: RedisClientOptions) => {
        const client = createClient(options);
        await client.connect();
        return client;
      },
    },
  ],
})
export class DataModule {}

import { Module } from '@nestjs/common';
import * as WebSocket from 'ws';
import { RedisModule } from 'src/common/modules/redis.module';
import { BitstampService } from './bitstamp.service';
import { WS, WS_CONFIG } from './bitstamp.constants';

@Module({
  imports: [RedisModule],
  providers: [
    BitstampService,
    {
      provide: WS_CONFIG,
      useValue: {
        address: 'wss://ws.bitstamp.net',
      },
    },
    {
      inject: [WS_CONFIG],
      provide: WS,
      useFactory: async ({ address }) => {
        const client = new WebSocket(address);
        return client;
      },
    },
  ],
})
export class BitstampModule {}

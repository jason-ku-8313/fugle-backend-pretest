import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisClientType } from 'redis';
import * as WebSocket from 'ws';
import { LiveTickerResponseDto } from './dto/live-ticker-response.dto';
import {
  EVENT_SUB_TICKER,
  CURRENCY_PAIRS,
  EVENT_SUB_TICKER_SUC,
} from './bitstamp.constants';
import {
  KEY_TICKER,
  REDIS_CLIENT_NAME,
} from '../common/constants/redis.constants';

@Injectable()
export class BitstampService implements OnModuleInit {
  private readonly logger = new Logger(BitstampService.name);
  private ws = new WebSocket('wss://ws.bitstamp.net');

  constructor(
    @Inject(REDIS_CLIENT_NAME) private readonly redis: RedisClientType,
  ) {}

  onModuleInit() {
    this.ws.on('open', () => {
      this.logger.log('Successfully connected to Bitstamp');

      // Subscribe all currency ticker
      CURRENCY_PAIRS.forEach((channel) => {
        this.ws.send(
          JSON.stringify({
            event: EVENT_SUB_TICKER,
            data: {
              channel,
            },
          }),
        );
      });

      this.ws.on('message', (message) => {
        const response: LiveTickerResponseDto = JSON.parse(message.toString());
        if (response.event === EVENT_SUB_TICKER_SUC) {
          this.logger.log(`Successfully subscribed: ${response.channel}`);
          return;
        }

        // Store ticker into redis sorted-set (TTL: 60s)
        const minutes = new Date().getMinutes();
        const key = KEY_TICKER.replace('{channel}', response.channel).replace(
          '{minutes}',
          minutes.toString(),
        );
        const item = {
          score: response.data.id,
          value: message.toString(),
        };
        this.redis
          .multi()
          .zAdd(key, [item])
          .expire(key, 60)
          .exec()
          .catch((err) => {
            this.logger.error(
              `Failed to store ticker into redis`,
              err.stack,
              message.toString(),
            );
          });
      });
    });
  }
}

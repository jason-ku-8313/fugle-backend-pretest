import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisClientType } from 'redis';
import WebSocket from 'ws';
import { LiveTickerResponseDto } from './dto/live-ticker-response.dto';
import {
  EVENT_SUB_TICKER,
  CURRENCY_PAIRS,
  EVENT_SUB_TICKER_SUC,
  WS_EVENT_OPEN,
  WS_EVENT_MESSAGE,
  WS,
} from './bitstamp.constants';
import {
  KEY_PUB_OHLC,
  KEY_TICKER,
  REDIS_CLIENT,
  REDIS_PUBLISHER,
} from '../common/constants/redis.constants';
import Decimal from 'decimal.js';
import { StreamingTickerOhlc } from '../streaming/interfaces/streaming-ticker-ohlc.interface';
import { LiveTickerDto } from './dto/live-ticker.dto';

@Injectable()
export class BitstampService implements OnModuleInit {
  private readonly logger = new Logger(BitstampService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
    @Inject(REDIS_PUBLISHER) private readonly publisher: RedisClientType,
    @Inject(WS) private readonly ws: WebSocket,
  ) {}

  onModuleInit() {
    this.ws.on(WS_EVENT_OPEN, () => {
      this.logger.log('Successfully connected to Bitstamp');

      // Subscribe all currency tickers
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

      this.ws.on(WS_EVENT_MESSAGE, (message) => {
        const response: LiveTickerResponseDto = JSON.parse(message.toString());
        if (response.event === EVENT_SUB_TICKER_SUC) {
          this.logger.log(`Successfully subscribed: ${response.channel}`);
          return;
        }
        this.handleReceiveLiveTicker(response);
      });
    });
  }

  async handleReceiveLiveTicker(response: LiveTickerResponseDto) {
    // Store ticker into redis sorted-set (TTL: 120s)
    const minutes = new Date().getMinutes();
    const key = KEY_TICKER.replace('{channel}', response.channel).replace(
      '{minutes}',
      minutes.toString(),
    );

    const responseJSON = JSON.stringify(response);
    const item = {
      score: response.data.id,
      value: responseJSON,
    };
    try {
      await this.redis.multi().zAdd(key, [item]).expire(key, 120).exec();
    } catch (err) {
      this.logger.error(
        `Failed to store ticker into redis: ${err.message}`,
        err.stack,
        item,
      );
    }
    this.handlePublishTickerOhlc(response);
  }

  // TODO: Cache OHLC result to prevent redundant calculating
  async handlePublishTickerOhlc(response: LiveTickerResponseDto) {
    const lastMinute = new Date(new Date().getTime() - 60 * 1000).getMinutes();
    const key = KEY_TICKER.replace('{channel}', response.channel).replace(
      '{minutes}',
      lastMinute.toString(),
    );
    try {
      // Get last minute tickers from redis and calculate OHLC
      const tickers: LiveTickerDto[] = (await this.redis.zRange(key, 0, -1))
        .map((item): LiveTickerResponseDto => JSON.parse(item))
        .map((resp) => resp.data);

      const tickerOhlc: StreamingTickerOhlc = {
        currencyPair: response.channel,
        lastPrice: response.data.price,
        lastPriceStr: response.data.price_str,
        lastTradeTimestamp: response.data.timestamp,
      };
      if (tickers.length) {
        tickerOhlc.open = tickers[0].price;
        tickerOhlc.openStr = tickerOhlc.open.toString();
        tickerOhlc.high = Decimal.max(...tickers.map((t) => t.price));
        tickerOhlc.highStr = tickerOhlc.high.toString();
        tickerOhlc.low = Decimal.min(...tickers.map((t) => t.price));
        tickerOhlc.lowStr = tickerOhlc.low.toString();
        tickerOhlc.close = tickers[tickers.length - 1].price;
        tickerOhlc.closeStr = tickerOhlc.close.toString();
      }

      // Publish OHLC
      const publishKey = KEY_PUB_OHLC.replace('{channel}', response.channel);
      this.publisher.publish(publishKey, JSON.stringify(tickerOhlc));
    } catch (err) {
      this.logger.error(`Failed publish OHLC: ${err.message}`, err.stack);
    }
  }
}

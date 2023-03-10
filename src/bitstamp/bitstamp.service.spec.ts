import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientType } from '@redis/client';
import Decimal from 'decimal.js';
import {
  REDIS_CLIENT,
  REDIS_PUBLISHER,
} from '../common/constants/redis.constants';
import {
  CURRENCY_PAIRS,
  EVENT_SUB_TICKER,
  EVENT_SUB_TICKER_SUC,
  LIVE_TRADES_BTCUSD,
  WS,
  WS_EVENT_MESSAGE,
  WS_EVENT_OPEN,
} from './bitstamp.constants';
import { BitstampService } from './bitstamp.service';
import { LiveTickerResponseDto } from './dto/live-ticker-response.dto';

describe('BitstampService', () => {
  let service: BitstampService;
  let redis: RedisClientType;
  let publisher: RedisClientType;
  let ws: any;

  beforeEach(async () => {
    const redisClientMock = {
      multi: jest.fn().mockReturnThis(),
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      zAdd: jest.fn().mockReturnThis(),
      zRange: jest.fn(),
      exec: jest.fn(),
    } as any;
    const publisherMock = {
      pSubscribe: jest.fn(),
      pUnsubscribe: jest.fn(),
    } as any;
    const wsMock = {
      on: jest.fn(),
      send: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BitstampService,
        {
          provide: REDIS_CLIENT,
          useValue: redisClientMock,
        },
        {
          provide: REDIS_PUBLISHER,
          useValue: publisherMock,
        },
        {
          provide: WS,
          useValue: wsMock,
        },
      ],
    }).compile();

    service = module.get<BitstampService>(BitstampService);
    redis = module.get<RedisClientType>(REDIS_CLIENT);
    publisher = module.get<RedisClientType>(REDIS_PUBLISHER);
    ws = module.get<any>(WS);
  });

  describe('onModuleInit', () => {
    it('should successfully connect to Bitstamp and subscribe all currency tickers', async () => {
      // Arrange
      const expectedChannels = CURRENCY_PAIRS;

      // Act
      ws.on.mockImplementationOnce((event: string, cb: () => void) => {
        if (event === WS_EVENT_OPEN) {
          cb();
        }
      });

      await service.onModuleInit();

      // Assert
      expect(ws.on).toHaveBeenCalledWith(WS_EVENT_OPEN, expect.any(Function));
      expect(ws.send).toHaveBeenCalledTimes(expectedChannels.length);
      expectedChannels.forEach((channel) => {
        expect(ws.send).toHaveBeenCalledWith(
          JSON.stringify({
            event: EVENT_SUB_TICKER,
            data: { channel },
          }),
        );
      });
    });

    it('should handle successfully subscribed event', async () => {
      // Arrange
      const response: LiveTickerResponseDto = {
        event: EVENT_SUB_TICKER_SUC,
        channel: LIVE_TRADES_BTCUSD,
        data: {
          id: 123,
          amount: new Decimal(0),
          amount_str: '0',
          price: new Decimal(0),
          price_str: '0',
          type: 0,
          timestamp: '',
          microtimestamp: '',
          buy_order_id: 123,
          sell_order_id: 123,
        },
      };
      const handleReceiveLiveTickerSpy = jest.spyOn(
        service,
        'handleReceiveLiveTicker',
      );
      const handlePublishTickerOhlcSpy = jest.spyOn(
        service,
        'handlePublishTickerOhlc',
      );
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      ws.on.mockImplementationOnce((event: string, cb: () => void) => {
        if (event === WS_EVENT_OPEN) {
          cb();
        }
      });

      ws.on.mockImplementationOnce((event: string, cb: (message) => void) => {
        if (event === WS_EVENT_MESSAGE) {
          cb(JSON.stringify(response));
        }
      });

      // Act
      await service.onModuleInit();

      // Assert
      expect(ws.on).toHaveBeenCalledWith(
        WS_EVENT_MESSAGE,
        expect.any(Function),
      );
      expect(handleReceiveLiveTickerSpy).not.toBeCalled();
      expect(handlePublishTickerOhlcSpy).not.toBeCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        `Successfully subscribed: ${LIVE_TRADES_BTCUSD}`,
      );
    });

    it('should handle live ticker response', async () => {
      // Arrange
      const message = JSON.stringify({
        event: 'trade',
        channel: 'live_trades_btcusd',
        data: {
          amount: new Decimal(0),
          buy_order_id: 123,
          sell_order_id: 123,
          amount_str: '0',
          price_str: '54666.60',
          timestamp: '1646992463',
          price: new Decimal(54666.6),
          type: 0,
          id: 134121455,
          microtimestamp: '1646992463',
        },
      });
      const handleReceiveLiveTickerSpy = jest.spyOn(
        service,
        'handleReceiveLiveTicker',
      );
      const handlePublishTickerOhlcSpy = jest.spyOn(
        service,
        'handlePublishTickerOhlc',
      );
      ws.on.mockImplementationOnce((event: string, cb: () => void) => {
        if (event === WS_EVENT_OPEN) {
          cb();
        }
      });

      ws.on.mockImplementationOnce((event: string, cb: (message) => void) => {
        if (event === WS_EVENT_MESSAGE) {
          cb(message);
        }
      });

      // Act
      await service.onModuleInit();

      // Assert
      expect(handleReceiveLiveTickerSpy).toHaveBeenCalledWith(
        JSON.parse(message),
      );
      expect(handlePublishTickerOhlcSpy).toHaveBeenCalledWith(
        JSON.parse(message),
      );
    });
  });

  describe('handleReceiveLiveTicker', () => {
    // TODO: test handleReceiveLiveTicker
  });

  describe('handlePublishTickerOhlc', () => {
    // TODO: test handlePublishTickerOhlc
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientType } from 'redis';
import {
  KEY_SUB_OHLC,
  REDIS_SUBSCRIBER,
} from '../../common/constants/redis.constants';
import { EVENT_TICKER_OHLC } from '../streaming.constants';
import { StreamingGateway } from './streaming.gateway';

describe('StreamingGateway', () => {
  let gateway: StreamingGateway;
  let redisClientMock: RedisClientType;

  beforeEach(async () => {
    redisClientMock = {
      pSubscribe: jest.fn(),
      pUnsubscribe: jest.fn(),
    } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamingGateway,
        { provide: REDIS_SUBSCRIBER, useValue: redisClientMock },
      ],
    }).compile();

    gateway = module.get<StreamingGateway>(StreamingGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should log message when a new client connects', async () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleConnection();

      expect(loggerSpy).toHaveBeenCalledWith('New client connected');
    });
  });

  describe('handleDisconnect', () => {
    it('should log message when a client disconnects', async () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleDisconnect();

      expect(loggerSpy).toHaveBeenCalledWith('Client disconnected');
    });
  });

  describe('handleSubscribe', () => {
    it('should subscribe to Redis channel when a client subscribes', async () => {
      const clientMock = {} as any;

      await gateway.handleSubscribe(clientMock);

      expect(redisClientMock.pSubscribe).toHaveBeenCalledWith(
        KEY_SUB_OHLC,
        expect.any(Function),
      );
    });

    it('should emit "ticker_ohlc" event to client when a message is received from Redis', async () => {
      const clientMock = {
        emit: jest.fn(),
      } as any;
      const message = JSON.stringify({ foo: 'bar' });

      await gateway.handleSubscribe(clientMock);
      const onMessageCallback = (redisClientMock.pSubscribe as jest.Mock).mock
        .calls[0][1];
      onMessageCallback(message);

      expect(clientMock.emit).toHaveBeenCalledWith(EVENT_TICKER_OHLC, message);
    });

    it('should return success message when a client subscribes', async () => {
      const clientMock = {} as any;

      const result = await gateway.handleSubscribe(clientMock);

      expect(result).toBe('You have successfully subscribed.');
    });
  });

  describe('handleUnsubscribe', () => {
    it('should unsubscribe from Redis channel when a client unsubscribes', async () => {
      await gateway.handleUnsubscribe();

      expect(redisClientMock.pUnsubscribe).toHaveBeenCalledWith(KEY_SUB_OHLC);
    });

    it('should return success message when a client unsubscribes', async () => {
      const result = await gateway.handleUnsubscribe();

      expect(result).toBe('You have successfully unsubscribed.');
    });
  });
});

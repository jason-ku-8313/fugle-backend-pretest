import { Inject, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisClientType } from 'redis';
import {
  KEY_SUB_OHLC,
  REDIS_SUBSCRIBER,
} from '../../common/constants/redis.constants';
import {
  EVENT_SUBSCRIBE,
  EVENT_TICKER_OHLC,
  EVENT_UNSUBSCRIBE,
} from '../streaming.constants';

@WebSocketGateway({ namespace: 'streaming' })
export class StreamingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly redis: RedisClientType,
  ) {}

  private readonly logger = new Logger(StreamingGateway.name);

  async handleConnection() {
    this.logger.log(`New client connected`);
  }
  async handleDisconnect() {
    this.logger.log(`Client disconnected`);
  }

  @SubscribeMessage(EVENT_SUBSCRIBE)
  handleSubscribe(@ConnectedSocket() client: Server) {
    this.redis.pSubscribe(KEY_SUB_OHLC, (message) => {
      client.emit(EVENT_TICKER_OHLC, message);
    });
    return 'You have successfully subscribed.';
  }

  @SubscribeMessage(EVENT_UNSUBSCRIBE)
  handleUnsubscribe() {
    this.redis.pUnsubscribe(KEY_SUB_OHLC);
    return 'You have successfully unsubscribed.';
  }
}

import { Module } from '@nestjs/common';
import { RedisModule } from 'src/common/modules/redis.module';
import { StreamingGateway } from './gateways/streaming.gateway';

@Module({
  imports: [RedisModule],
  providers: [StreamingGateway],
})
export class StreamingModule {}

import { Module } from '@nestjs/common';
import { DataModule } from './data/data.module';
import { RedisModule } from './common/modules/redis.module';
import { StreamingModule } from './streaming/streaming.module';
import { BitstampModule } from './bitstamp/bitstamp.module';

@Module({
  imports: [DataModule, RedisModule, StreamingModule, BitstampModule],
})
export class AppModule {}

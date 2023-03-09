import { Module } from '@nestjs/common';
import { DataModule } from './data/data.module';
import { StreamingModule } from './streaming/streaming.module';
import { BitstampService } from './bitstamp/bitstamp.service';
import { RedisModule } from './common/modules/redis.module';

@Module({
  imports: [DataModule, StreamingModule, RedisModule],
  providers: [BitstampService],
})
export class AppModule {}

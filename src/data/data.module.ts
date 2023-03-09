import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RedisModule } from 'src/common/modules/redis.module';
import { DataController } from './data.controller';
import { DataService } from './data.service';

@Module({
  imports: [HttpModule.register({ timeout: 3000 }), RedisModule],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {}

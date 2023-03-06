import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DataController } from './data.controller';
import { DataService } from './data.service';

@Module({
  imports: [HttpModule.register({ timeout: 3000 })],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {}

import { Controller, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataService } from './data.service';
import { FindTopStoriesDto } from './dto/find-top-stories.dto';
import { TopStories } from './interfaces/top-stories.interface';

@Controller('data')
export class DataController {
  constructor(private dataService: DataService) {}

  @Get()
  findTopStories(
    @Query()
    params: FindTopStoriesDto,
  ): Observable<TopStories> {
    return this.dataService.findTopStories(params.user);
  }
}

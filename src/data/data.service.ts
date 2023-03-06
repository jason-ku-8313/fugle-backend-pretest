import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { TopStories } from './interfaces/top-stories.interface';

@Injectable()
export class DataService {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(DataService.name);

  findTopStories(userId: number): Observable<TopStories> {
    return this.httpService
      .get<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json')
      .pipe(
        map((res) => res.data),
        map((data) => ({ result: data })),
      )
      .pipe(
        catchError((error: AxiosError) => {
          this.logger.error(
            'Failed to get Hacker-News top stories',
            error.stack,
          );
          throw new InternalServerErrorException();
        }),
      );
  }
}

import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DataService>(DataService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('findTopStories', () => {
    it('should return an Observable of TopStories', () => {
      const testData = [1, 2, 3];
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(
          () => of({ data: testData }) as Observable<AxiosResponse<number[]>>,
        );
      const expected = { result: testData };

      const result = service.findTopStories(123);

      result.subscribe((result) => {
        expect(result).toEqual(expected);
      });
    });

    it('should throw an InternalServerErrorException on error', () => {
      const error = { stack: 'error' };
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => throwError(() => error));

      const result = service.findTopStories(123).pipe(
        catchError((err) => {
          expect(err).toBeInstanceOf(InternalServerErrorException);
          return of({});
        }),
      );

      result.subscribe();
    });
  });
});

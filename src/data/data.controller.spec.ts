import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { TopStories } from './interfaces/top-stories.interface';

describe('DataController', () => {
  let controller: DataController;
  let service: DataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataController],
      providers: [
        {
          provide: DataService,
          useValue: {
            findTopStories: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DataController>(DataController);
    service = module.get<DataService>(DataService);
  });

  describe('findTopStories', () => {
    it('should return an Observable of TopStories', () => {
      const testData: TopStories = { result: [1, 2, 3] };
      jest.spyOn(service, 'findTopStories').mockReturnValueOnce(of(testData));

      const result = controller.findTopStories({ user: 123 });

      result.subscribe((result) => {
        expect(result).toEqual(testData);
      });
    });
  });
});

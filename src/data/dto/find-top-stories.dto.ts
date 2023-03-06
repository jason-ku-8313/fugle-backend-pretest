import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class FindTopStoriesDto {
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  user: number;
}

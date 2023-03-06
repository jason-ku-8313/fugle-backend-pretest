import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { FindTopStoriesDto } from './find-top-stories.dto';

describe.only('FindTopStoriesDto', () => {
  it('should pass validation when user is a valid number', async () => {
    const dto = plainToClass(FindTopStoriesDto, { user: 123 });

    const errors: ValidationError[] = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail validation when user is not an integer', async () => {
    const dto = plainToClass(FindTopStoriesDto, { user: 'abc' });

    const errors: ValidationError[] = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('user');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  it('should fail validation when user is less than 1', async () => {
    const dto = plainToClass(FindTopStoriesDto, { user: 0 });

    const errors: ValidationError[] = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('user');
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should fail validation when user is greater than 1000', async () => {
    const dto = plainToClass(FindTopStoriesDto, { user: 1001 });

    const errors: ValidationError[] = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('user');
    expect(errors[0].constraints).toHaveProperty('max');
  });
});

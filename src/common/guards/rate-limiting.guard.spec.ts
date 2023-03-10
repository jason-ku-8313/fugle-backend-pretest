import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { RateLimitingGuard } from './rate-limiting.guard';
import { getClientIp } from 'request-ip';
import { REDIS_CLIENT } from '../constants/redis.constants';

jest.mock('request-ip');

describe('RateLimitingGuard', () => {
  let guard: RateLimitingGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitingGuard,
        {
          provide: REDIS_CLIENT,
          useValue: {
            multi: jest.fn().mockReturnThis(),
            incr: jest.fn().mockReturnThis(),
            expire: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RateLimitingGuard>(RateLimitingGuard);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow request when under rate limit', async () => {
    // Arrange
    const mockRequest = {
      query: { user: 123 },
      headers: {},
    };
    jest.useFakeTimers().setSystemTime(new Date().setMinutes(0));
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
    (getClientIp as jest.Mock).mockReturnValueOnce('127.0.0.1');

    const mockRedisMulti = guard['redis'].multi();
    (mockRedisMulti.incr as jest.Mock).mockReturnThis();
    (mockRedisMulti.expire as jest.Mock).mockReturnThis();
    (mockRedisMulti.exec as jest.Mock)
      .mockResolvedValueOnce([1, true])
      .mockResolvedValueOnce([1, true]);

    // Act
    const canActivateResult = await guard.canActivate(mockContext);

    // Assert
    expect(canActivateResult).toBeTruthy();
    expect(mockRedisMulti.incr).toHaveBeenCalledTimes(2);
    expect(mockRedisMulti.incr).toHaveBeenCalledWith('127.0.0.1-0');
    expect(mockRedisMulti.incr).toHaveBeenCalledWith('123-0');
    expect(mockRedisMulti.expire).toHaveBeenCalledTimes(2);
    expect(mockRedisMulti.expire).toHaveBeenCalledWith('127.0.0.1-0', 60);
    expect(mockRedisMulti.expire).toHaveBeenCalledWith('123-0', 60);
    expect(mockRedisMulti.exec).toHaveBeenCalledTimes(2);
  });

  it('should reject request when over IP rate limit', async () => {
    // Arrange
    const mockRequest = {
      query: {},
      headers: {},
    };
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
    (getClientIp as jest.Mock).mockReturnValueOnce('127.0.0.1');

    const mockRedisMulti = guard['redis'].multi();
    (mockRedisMulti.incr as jest.Mock).mockReturnThis();
    (mockRedisMulti.expire as jest.Mock).mockReturnThis();
    (mockRedisMulti.exec as jest.Mock)
      .mockResolvedValueOnce([11, true])
      .mockResolvedValueOnce([1, true]);

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrowError(
      'Forbidden',
    );
  });

  it('should reject request when over user rate limit', async () => {
    // Arrange
    const mockRequest = {
      query: {
        user: '123',
      },
      headers: {},
    };
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const mockRedisMulti = guard['redis'].multi();
    (mockRedisMulti.incr as jest.Mock).mockReturnThis();
    (mockRedisMulti.expire as jest.Mock).mockReturnThis();
    (mockRedisMulti.exec as jest.Mock)
      .mockResolvedValueOnce([1, true])
      .mockResolvedValueOnce([6, true]);

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrowError(
      'Forbidden',
    );
  });
});

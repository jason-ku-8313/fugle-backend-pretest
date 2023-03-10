import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { getClientIp } from 'request-ip';
import { RedisClientType } from '@redis/client';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { REDIS_CLIENT } from '../constants/redis.constants';

const IP_MAX_REQUEST_NUM = 10;
const USER_MAX_REQUEST_NUM = 5;
const EXPIRATION_SEC = 60;

/**
 * Rules:
 *  1. Each ip address allows {@link IP_MAX_REQUEST_NUM} requests per minute
 *  2. Each user allows {@link USER_MAX_REQUEST_NUM} requests per minute
 */
@Injectable()
export class RateLimitingGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ipAddress: string = getClientIp(request);
    const userId = request.query.user as string;
    const minute = new Date().getMinutes();
    const redisKeys = [
      this.getRedisKey(ipAddress, minute),
      this.getRedisKey(userId, minute),
    ];

    const promises = redisKeys.map((key) =>
      this.redis.multi().incr(key).expire(key, EXPIRATION_SEC).exec(),
    );
    const [[ipRequestCount], [userRequestCount]] = await Promise.all(promises);
    if (
      ipRequestCount > IP_MAX_REQUEST_NUM ||
      userRequestCount > USER_MAX_REQUEST_NUM
    ) {
      throw new ForbiddenException({
        ip: ipRequestCount,
        id: userRequestCount,
      });
    }
    return true;
  }

  /**
   * Example Outputs:
   * * Case 1. 127.0.0.1(ip) + 12:59(current time) = "127.0.0.1-59"
   * * Case 2. 123(userid) + 12:59(current time) = "123-59"
   *
   * @param prefix
   * @param minutes
   * @returns
   */
  private getRedisKey(prefix: string, minutes: number): string {
    return `${prefix}-${minutes}`;
  }
}

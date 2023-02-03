import { RedisClientType } from "redis";

export class RedisAdapter<T extends Record<string, string>> {

  private redis: RedisClientType

  constructor(redis: RedisClientType) {
    this.redis = redis
  }

  set = async (key: string, value: T) => await this.redis.hSet(key, value);
  get = async (key: string): Promise<T> => await this.redis.hGetAll(key) as T
  delete = async (key: string) => await this.redis.del(key)
}

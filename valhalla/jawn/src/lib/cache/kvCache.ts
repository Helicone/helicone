import RedisClient from "ioredis";
import { redisClient } from "../clients/redisClient";
import { InMemoryCache } from "./staticMemCache";

export class KVCache {
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private cache: InMemoryCache;
  private redisClient: RedisClient | null;

  constructor(private ttl = KVCache.DEFAULT_TTL) {
    this.cache = new InMemoryCache(1000);
    this.redisClient = redisClient;
  }

  async get<T>(key: string): Promise<T | null> {
    const cachedValue = this.cache.get<T>(key);
    if (cachedValue) {
      return cachedValue;
    }

    if (this.redisClient) {
      const redisValue = await this.redisClient.get(key);
      if (redisValue) {
        this.cache.set(key, redisValue, this.ttl);
        return JSON.parse(redisValue) as T;
      }
    }

    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value, this.ttl);
    if (this.redisClient) {
      await this.redisClient.set(key, JSON.stringify(value), "PX", this.ttl);
    }
  }
}

import RedisClient from "ioredis";
import { redisClient } from "../clients/redisClient";

function tryParse(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return txt;
  }
}

export class KVRedisCache {
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private redisClient: RedisClient | null;

  constructor(private ttl = KVRedisCache.DEFAULT_TTL) {
    this.redisClient = redisClient;
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redisClient) {
      console.log("redis is connected");
      const redisValue = await this.redisClient.get(key);
      if (redisValue) {
        return tryParse(tryParse(redisValue)) as T;
      }
    } else {
      console.log("redis is not connected");
    }

    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.set(
        key,
        Buffer.from(JSON.stringify(value)),
        "PX",
        this.ttl
      );
    }
  }
}

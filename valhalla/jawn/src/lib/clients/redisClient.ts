import RedisClient from "ioredis";

const redisHost = process.env.REDIS_HOST;

export let redisClient: RedisClient | null = null;
if (redisHost) {
  redisClient = new RedisClient({
    port: 6379,
    host: redisHost,
    tls: {},
  });
}

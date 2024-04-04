// import Redis from "ioredis";
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters

const redisHost = process.env.REDIS_HOST;

export let redisClient: Redis | null = null;
if (redisHost) {
  redisClient = new Redis({
    url: `${redisHost}:6379`,
    token: "",
  });
}

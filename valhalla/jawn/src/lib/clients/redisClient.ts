import RedisClient from "ioredis";
export const redisClient = new RedisClient();

// const redisHost = process.env.REDIS_HOST || "127.0.0.1";

// export let redisClient: RedisClient | null = null;
// if (redisHost) {
//   console.log("redisHost", redisHost);
//   redisClient = new RedisClient({
//     port: 6379,
//     host: redisHost,
//     tls: {},
//   });
//   console.log("redisClient", redisClient.status);
// }

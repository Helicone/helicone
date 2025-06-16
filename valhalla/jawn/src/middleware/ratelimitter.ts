import { redisClient } from "../lib/clients/redisClient";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { type JawnAuthenticatedRequest } from "../types/request";
import { postHogClient } from "../lib/clients/postHogClient";

export const IS_RATE_LIMIT_ENABLED = !!process.env.REDIS_HOST;

export let limiter: any | null = null;
if (IS_RATE_LIMIT_ENABLED) {
  limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      return (
        (req as JawnAuthenticatedRequest)?.authParams?.organizationId ??
        req.ip ??
        "unknown"
      );
    },
    limit: (req) => {
      const authParams = (req as JawnAuthenticatedRequest)?.authParams;
      if (req.path.startsWith("/v1/log")) {
        return 1_000_000;
      }
      if (
        req.path.startsWith("/v1/trace") ||
        req.path.startsWith("/v1/router/control-plane/sign-s3-url")
      ) {
        return 10_000;
      }
      return 200;
    },

    handler: (req, res, next) => {
      next();
    },
    store: new RedisStore({
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
  });
}

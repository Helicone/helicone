import { redisClient } from "../lib/clients/redisClient";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { JawnAuthenticatedRequest } from "../types/request";
import { postHogClient } from "../lib/clients/postHogClient";

export const IS_RATE_LIMIT_ENABLED = !!process.env.REDIS_HOST;

export let limiter: any | null = null;
if (IS_RATE_LIMIT_ENABLED) {
  limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // limit each Organization to 200 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      return (req as JawnAuthenticatedRequest).authParams.organizationId;
    },
    handler: (req, res, next) => {
      postHogClient?.capture({
        distinctId: "jawn-server",
        event: "rate-limited",
        properties: {
          orgId: (req as JawnAuthenticatedRequest).authParams.organizationId,
          wasRateLimited: true,
          url: req.url,
          method: req.method,
          body: req.body,
        },
      });
      next();
    },
    store: new RedisStore({
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
  });
}

import { Env } from "..";
import { AuthParams } from "../lib/dbLogger/DBLoggable";

export class RateLimiter {
  constructor(
    private rateLimiter: Env["RATE_LIMITER"],
    private authParams: AuthParams
  ) {}

  private getRateLimitParams(tier: string) {
    if (tier === "pro") {
      return {
        windowSizeSeconds: 60,
        maxCount: 10_000,
      };
    } else if (tier === "enterprise") {
      return {
        windowSizeSeconds: 60,
        maxCount: 100_000,
      };
    } else {
      return {
        windowSizeSeconds: 60,
        maxCount: 10,
      };
    }
  }

  async checkRateLimit(tier: string) {
    const rateLimiterId = this.rateLimiter.idFromName("hello");

    const rateLimiter = this.rateLimiter.get(rateLimiterId);

    const params = this.getRateLimitParams(tier);

    const rateLimitRes = await rateLimiter.fetch("https://www.google.com", {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "content-type": "application/json",
      },
    });

    return await rateLimitRes.json<{
      isRateLimited: boolean;
      shouldLogInDB: boolean;
      rlIncrementDB: number;
    }>();
  }
}

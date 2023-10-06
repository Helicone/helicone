import { Env } from "..";
import { AuthParams } from "../lib/dbLogger/DBLoggable";

export class RateLimiter {
  constructor(
    private rateLimiter: Env["RATE_LIMITER"],
    private authParams: AuthParams
  ) {}

  async checkRateLimit() {
    console.log(
      "Checking rate limit",
      this.rateLimiter,
      this.authParams.organizationId
    );
    const rateLimiterId = this.rateLimiter.idFromName("hello");
    console.log("Rate limiter id", rateLimiterId);
    const rateLimiter = this.rateLimiter.get(rateLimiterId);
    console.log(
      "Rate limiterz",
      rateLimiter,
      rateLimiter.name,
      rateLimiter.id.name
    );

    const rateLimitRes = await rateLimiter.fetch("/", {
      method: "POST",
      body: JSON.stringify({
        windowSizeSeconds: 60,
        maxCount: 10,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    return await rateLimitRes.json<{
      isRateLimited: boolean;
      shouldLogInDB: boolean;
    }>();
  }
}

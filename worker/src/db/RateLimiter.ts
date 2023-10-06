import { Env } from "..";
import { AuthParams } from "../lib/dbLogger/DBLoggable";

export class RateLimiter {
  constructor(
    private rateLimiter: Env["RATE_LIMITER"],
    private authParams: AuthParams
  ) {}

  async checkRateLimit() {
    const rateLimiterId = this.rateLimiter.idFromName(
      this.authParams.organizationId
    );
    const rateLimiter = this.rateLimiter.get(rateLimiterId);

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

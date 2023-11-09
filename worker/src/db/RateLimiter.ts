import { Env } from "..";
import { AuthParams } from "../lib/dbLogger/DBLoggable";

export class RateLimiter {
  constructor(
    private rateLimiter: Env["RATE_LIMITER"],
    private authParams: AuthParams
  ) {}

  private getRateLimitParams(tier: string) {
    const rateLimitParams: Record<
      string,
      {
        windowSizeSeconds: number;
        maxCount: number;
      }
    > = {
      pro: {
        windowSizeSeconds: 60,
        maxCount: 10_000,
      },
      enterprise: {
        windowSizeSeconds: 60,
        maxCount: 100_000,
      },
      free: {
        windowSizeSeconds: 60,
        maxCount: 1_000,
      },
    };
    tier = tier?.toLowerCase() in rateLimitParams ? tier.toLowerCase() : "free";

    return rateLimitParams[tier];
  }

  async checkRateLimit(tier: string): Promise<{
    isRateLimited: boolean;
    shouldLogInDB: boolean;
    rlIncrementDB: number;
  }> {
    const rateLimiterId = this.rateLimiter.idFromName(
      this.authParams.organizationId
    );

    const rateLimiter = this.rateLimiter.get(rateLimiterId);

    const params = this.getRateLimitParams(tier);

    const rateLimitRes = await rateLimiter.fetch(
      "https://www.this_does_matter.helicone.ai",
      {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await rateLimitRes.json()) as any;
  }
}

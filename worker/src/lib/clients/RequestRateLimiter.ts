import { Env } from "../..";
import { AuthParams } from "../dbLogger/DBLoggable";
import { Result, err, ok } from "../util/results";

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
      // pro: {
      //   windowSizeSeconds: 60,
      //   maxCount: 10_000,
      // },
      // enterprise: {
      //   windowSizeSeconds: 60,
      //   maxCount: 100_000,
      // },
      // free: {
      //   windowSizeSeconds: 60,
      //   maxCount: 1_000,
      // },
      // Previously, the pro was 10,000 requests per minute = 166 requests per second
      // There are 12 5-second intervals in a minute
      // 10k / 12 = 833.3333333333334
      // Which is 166 requests per second
      pro: {
        windowSizeSeconds: 5,
        maxCount: 834,
      },
      growth: {
        windowSizeSeconds: 5,
        maxCount: 834,
      },
      // Previously, the enterprise was 100,000 requests per minute = 1666.6666666666667 requests per second
      // There are 12 5-second intervals in a minute
      // 100k / 12 = 8333.333333333334
      // Which is 1666.6666666666667 requests per second
      enterprise: {
        windowSizeSeconds: 5,
        maxCount: 8334,
      },
      // Previously, the free was 1,000 requests per minute = 16.666666666666668 requests per second
      // There are 12 5-second intervals in a minute
      // 1k / 12 = 83.33333333333334
      // Which is 16.666666666666668 requests per second
      free: {
        windowSizeSeconds: 5,
        maxCount: 84,
      },
    };
    tier = tier?.toLowerCase() in rateLimitParams ? tier.toLowerCase() : "free";

    return rateLimitParams[tier];
  }

  async checkRateLimit(tier: string): Promise<
    Result<
      {
        isRateLimited: boolean;
        shouldLogInDB: boolean;
        rlIncrementDB: number;
      },
      string
    >
  > {
    try {
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

      return ok(
        (await rateLimitRes.json()) as {
          isRateLimited: boolean;
          shouldLogInDB: boolean;
          rlIncrementDB: number;
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return err(JSON.stringify(error));
    }
  }
}

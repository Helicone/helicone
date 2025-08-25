import { AuthParams } from "../dbLogger/DBLoggable";
import { Result, err, ok } from "../util/results";

export class RateLimiter {
  constructor(
    private rateLimiter: Env["RATE_LIMITER"],
    private authParams: AuthParams
  ) {}

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

      const rateLimitRes = await rateLimiter.fetch(
        "https://www.this_does_matter.helicone.ai",
        {
          method: "POST",
          body: JSON.stringify({
            windowSizeSeconds: 60,
            maxCount: getRPMFromTier(tier),
          }),
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

function getRPMFromTier(tier: string): number {
  if (!tier || typeof tier !== "string") {
    return 60;
  } else if (tier.startsWith("enterprise")) {
    return 520;
  } else if (tier.startsWith("team")) {
    return 240;
  } else if (tier.startsWith("pro")) {
    return 120;
  } else if (tier.startsWith("growth")) {
    return 60;
  } else {
    return 60;
  }
}

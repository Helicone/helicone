import { Result, err } from "../shared/result";
import { RateLimitOptions } from "./RateLimiter";

export class RateLimitOptionsBuilder {
  constructor(private policy: string | null) {}

  build(): Result<RateLimitOptions | undefined, string> {
    if (this.policy) {
      return this.parsePolicy(this.policy);
    }

    return {
      data: undefined,
      error: null,
    };
  }

  parsePolicy(input: string): Result<RateLimitOptions, string> {
    const regex = /^(\d+);w=(\d+)(?:;u=(request|cents))?(?:;s=([\w-]+))?$/;

    const match = input.match(regex);

    if (!match) {
      return err("Invalid rate limit string format");
    }

    const quota = parseInt(match[1], 10);
    const time_window = parseInt(match[2], 10);
    const unit = match[3] as RateLimitOptions["unit"] | undefined;

    if (unit !== undefined && unit !== "request" && unit !== "cents") {
      return err("Invalid rate limit unit");
    }
    const segment = match[4];

    return {
      data: {
        quota,
        time_window,
        unit: unit || "request",
        segment,
      },
      error: null,
    };
  }
}

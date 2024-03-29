import { Result } from "./results";

export interface RateLimitOptions {
  time_window: number;
  segment: string | undefined;
  quota: number;
  unit: "token" | "request" | "dollar";
}

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
    const regex =
      /^(\d+);w=(\d+)(?:;u=(request|token|dollar))?(?:;s=([\w-]+))?$/;

    const match = input.match(regex);
    if (!match) {
      return {
        data: null,
        error: "Invalid rate limit string format",
      };
    }

    const quota = parseInt(match[1], 10);
    const time_window = parseInt(match[2], 10);
    const unit = match[3] as "request" | "token" | "dollar" | undefined;
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

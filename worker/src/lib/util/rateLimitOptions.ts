import { RateLimitOptions } from "../clients/KVRateLimiterClient";
import { Result, err, ok } from "./results";

export class RateLimitOptionsBuilder {
  constructor(private policy: string | null, private policyV2: string | null) {}

  build(): Result<RateLimitOptions | undefined, string> {
    if (this.policyV2) {
      return this.parsePolicyV2(this.policyV2);
    }

    if (this.policy) {
      return this.parsePolicy(this.policy);
    }

    return {
      data: undefined,
      error: null,
    };
  }

  validatePolicy(key: string, value: string): Result<void, string> {
    if (key === "w" && !/^\d+$/.test(value)) {
      return err("Invalid rate limit time window");
    }

    if (key === "s" && !/^\w+$/.test(value)) {
      return err("Invalid rate limit segment");
    }

    if (key === "q" && !/^\d+$/.test(value)) {
      return err("Invalid rate limit quota");
    }

    if (key === "u" && value !== "request" && value !== "cents") {
      return err("Invalid rate limit unit");
    }

    return {
      data: undefined,
      error: null,
    };
  }

  parsePolicyV2(input: string): Result<RateLimitOptions, string> {
    //w=[time_window];s=[segment]
    const configs = input.split(";");

    const kvPairs = configs.map((config) => {
      const keyValuePattern = /^(\w+)=(\w+)$/;

      const match = config.match(keyValuePattern);

      if (!match) {
        return err("Invalid rate limit string format");
      }

      const key = match[1];
      const value = match[2];

      return ok({ key, value });
    });

    if (kvPairs.some((kv) => kv.error)) {
      return kvPairs.find((result) => result.error !== null) as Result<
        RateLimitOptions,
        string
      >;
    }

    const kvPairsData = kvPairs.map((kv) => kv.data) as {
      key: string;
      value: string;
    }[];

    for (const kv of kvPairsData) {
      const result = this.validatePolicy(kv.key, kv.value);

      if (result.error) {
        return result;
      }
    }

    const quota = parseInt(
      kvPairsData.find((kv) => kv.key === "q")?.value ?? "0",
      10
    );

    if (quota === 0) {
      return err("Invalid rate limit quota, must provide a positive q value");
    }

    const timeWindow = parseInt(
      kvPairsData.find((kv) => kv.key === "w")?.value ?? "0",
      10
    );

    if (timeWindow === 0) {
      return err(
        "Invalid rate limit time window, must provide a positive w value"
      );
    }

    const unit = (kvPairsData.find((kv) => kv.key === "u")?.value ??
      "request") as RateLimitOptions["unit"];

    const segment = kvPairsData.find((kv) => kv.key === "s")?.value;

    return {
      data: {
        quota,
        time_window: timeWindow,
        unit: unit || "request",
        segment,
      },
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

import { err } from "./results";
export class RateLimitOptionsBuilder {
    policy;
    constructor(policy) {
        this.policy = policy;
    }
    build() {
        if (this.policy) {
            return this.parsePolicy(this.policy);
        }
        return {
            data: undefined,
            error: null,
        };
    }
    parsePolicy(input) {
        const regex = /^(\d+);w=(\d+)(?:;u=(request|cents))?(?:;s=([\w-]+))?$/;
        const match = input.match(regex);
        if (!match) {
            return err("Invalid rate limit string format");
        }
        const quota = parseInt(match[1], 10);
        const time_window = parseInt(match[2], 10);
        const unit = match[3];
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

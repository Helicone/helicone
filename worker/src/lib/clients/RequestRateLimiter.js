import { err, ok } from "../util/results";
export class RateLimiter {
    rateLimiter;
    authParams;
    constructor(rateLimiter, authParams) {
        this.rateLimiter = rateLimiter;
        this.authParams = authParams;
    }
    async checkRateLimit(tier) {
        try {
            const rateLimiterId = this.rateLimiter.idFromName(this.authParams.organizationId);
            const rateLimiter = this.rateLimiter.get(rateLimiterId);
            const rateLimitRes = await rateLimiter.fetch("https://www.this_does_matter.helicone.ai", {
                method: "POST",
                body: JSON.stringify({
                    windowSizeSeconds: 60,
                    maxCount: 100,
                }),
                headers: {
                    "content-type": "application/json",
                },
            });
            return ok((await rateLimitRes.json()));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            return err(JSON.stringify(error));
        }
    }
}

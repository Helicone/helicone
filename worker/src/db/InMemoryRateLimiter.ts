import { Request } from "@cloudflare/workers-types";

export class InMemoryRateLimiter {
  transactions: number[] = [];
  windowSizeSeconds: number;
  maxCount: number;

  constructor(private state: DurableObjectState) {
    // Default is free tier
    this.windowSizeSeconds = 60;
    this.maxCount = 1000;
  }

  async fetch(request: Request) {
    const { windowSizeSeconds, maxCount } = await request.json<{
      windowSizeSeconds: number;
      maxCount: number;
    }>();

    this.windowSizeSeconds = windowSizeSeconds;
    this.maxCount = maxCount;
    const now = Date.now();
    this.transactions = this.transactions.filter(
      (t) => t > now - this.windowSizeSeconds * 1000
    );

    let isRateLimited = false;
    let shouldLogInDB = false;
    if (this.transactions.length <= this.maxCount) {
      // Not rate limited
      this.transactions.push(now);
    } else {
      // Rate limited
      isRateLimited = true;
      shouldLogInDB = true;
    }

    return new Response(JSON.stringify({ isRateLimited }), {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  }
}

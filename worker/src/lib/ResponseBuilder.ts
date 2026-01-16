import { RateLimitHeaders } from "./rate-limit/bucketClient";

export interface BuildParams {
  body: BodyInit | null;
  status: number;
  inheritFrom?: Response;
}

export class ResponseBuilder {
  private headers: Headers = new Headers();

  setHeader(key: string, value: string): ResponseBuilder {
    this.headers.set(key, value);
    return this;
  }

  addTokenBucketRateLimitHeaders(headers: RateLimitHeaders): void {
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        this.setHeader(key, value);
      }
    });
  }

  build(params: BuildParams): Response {
    const { body, inheritFrom: _inheritFrom } = params;
    let { status } = params;
    const inheritFrom = _inheritFrom ?? new Response();

    const headers = new Headers(inheritFrom.headers);
    this.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    if (status < 200 || status >= 600) {
      status = 500;
    }

    const res = new Response(body, {
      ...inheritFrom,
      headers,
      status,
    });

    return res;
  }

  buildRateLimitedResponse(): Response {
    this.setHeader("content-type", "application/json;charset=UTF-8");
    // Mark as a Helicone-generated rate limit for upstream logic
    this.setHeader("X-Helicone-Error", "rate_limited");

    return this.build({
      body: JSON.stringify({
        message:
          "Helicone user was rate limit via Helicone-RateLimit-Policy header. Please wait before making more requests. See https://docs.helicone.ai/features/advanced-usage/custom-rate-limits for more details.",
      }),
      status: 429,
    });
  }
}

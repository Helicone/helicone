import { RateLimitOptions, RateLimitResponse } from "./RateLimiter";

import { Readable } from "stream";
import { Response, Headers } from "node-fetch";

export interface BuildParams {
  body: any; // Express allows various types for body (string, object, buffer, etc.)
  status: number;
  inheritFrom?: Response;
}

export class ResponseBuilder {
  private headers: { [key: string]: string } = {};

  setHeader(key: string, value: string): ResponseBuilder {
    this.headers[key] = value;
    return this;
  }

  addRateLimitHeaders(
    rateLimitCheckResult: RateLimitResponse,
    rateLimitOptions: RateLimitOptions
  ): void {
    const policy = `${rateLimitOptions.quota};w=${rateLimitOptions.time_window};u=${rateLimitOptions.unit}`;
    const headers: { [key: string]: string } = {
      "Helicone-RateLimit-Limit": rateLimitCheckResult.limit.toString(),
      "Helicone-RateLimit-Remaining": rateLimitCheckResult.remaining.toString(),
      "Helicone-RateLimit-Policy": policy,
    };

    if (rateLimitCheckResult.reset !== undefined) {
      headers["Helicone-RateLimit-Reset"] =
        rateLimitCheckResult.reset.toString();
    }

    Object.entries(headers).forEach(([key, value]) => {
      this.setHeader(key, value);
    });
  }

  build(params: BuildParams): Response {
    const { body, inheritFrom: _inheritFrom } = params;
    let { status } = params;
    const inheritFrom = _inheritFrom ?? new Response();

    const headers = new Headers();
    inheritFrom.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    if (status < 200 || status >= 600) {
      console.log("Invalid status code:", status);
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

    return this.build({
      body: {
        message: "Rate limit reached. Please wait before making more requests.",
      },
      status: 429,
    });
  }

  readableStreamToNodeStream(readableStream: ReadableStream) {
    const reader = readableStream.getReader();
    const nodeStream = new Readable({
      async read() {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          this.push(Buffer.from(value));
        }
      },
    });
    return nodeStream;
  }
}

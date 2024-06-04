import { RateLimitOptions, RateLimitResponse } from "./RateLimiter";
import { Response as ExpressResponse } from "express";

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

  build(params: BuildParams, res: ExpressResponse): ExpressResponse {
    const { body, inheritFrom: _inheritFrom } = params;
    let { status } = params;

    if (_inheritFrom) {
      _inheritFrom.headers.forEach((value, key) => {
        this.headers[key] = value;
      });
    }

    if (status < 200 || status >= 600) {
      console.log("Invalid status code:", status);
      status = 500;
    }

    res.status(status);
    Object.entries(this.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    if (typeof body === "string") {
      return res.send(body);
    } else {
      return res.json(body);
    }
  }

  buildRateLimitedResponse(res: ExpressResponse): ExpressResponse {
    this.setHeader("content-type", "application/json;charset=UTF-8");

    return this.build(
      {
        body: {
          message:
            "Rate limit reached. Please wait before making more requests.",
        },
        status: 429,
      },
      res
    );
  }
}

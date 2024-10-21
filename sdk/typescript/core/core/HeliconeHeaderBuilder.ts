import { IHeliconeMeta } from "./HeliconeClientOptions";

export class HeliconeHeaderBuilder {
  private heliconeMeta: IHeliconeMeta;
  private headers: { [key: string]: string } = {};

  constructor(heliconeMeta: IHeliconeMeta) {
    this.heliconeMeta = heliconeMeta;
    const apiKey = heliconeMeta?.apiKey ?? process.env.HELICONE_API_KEY;
    this.headers = {
      "Helicone-Auth": `Bearer ${apiKey}`,
    };
  }

  withPropertiesHeader(): HeliconeHeaderBuilder {
    if (!this.heliconeMeta?.properties) return this;
    this.headers = {
      ...this.headers,
      ...this.getPropertyHeaders(this.heliconeMeta.properties),
    };
    return this;
  }

  withCacheHeader(): HeliconeHeaderBuilder {
    if (!this.heliconeMeta?.cache) return this;
    this.headers = {
      ...this.headers,
      ...this.getCacheHeaders(this.heliconeMeta.cache),
    };
    return this;
  }

  withRetryHeader(): HeliconeHeaderBuilder {
    if (!this.heliconeMeta?.retry) return this;
    this.headers = {
      ...this.headers,
      ...this.getRetryHeaders(this.heliconeMeta.retry),
    };
    return this;
  }

  withRateLimitPolicyHeader(): HeliconeHeaderBuilder {
    if (!this.heliconeMeta?.rateLimitPolicy) return this;
    this.headers = {
      ...this.headers,
      ...this.getRateLimitPolicyHeaders(this.heliconeMeta.rateLimitPolicy),
    };
    return this;
  }

  withUserHeader(): HeliconeHeaderBuilder {
    if (!this.heliconeMeta?.user) return this;
    this.headers = {
      ...this.headers,
      ...this.getUserHeader(this.heliconeMeta.user),
    };
    return this;
  }

  build(): { [key: string]: string } {
    return this.headers;
  }

  private getUserHeader(user?: string): { [key: string]: string } {
    return user ? { "Helicone-User-Id": user } : {};
  }

  private getPropertyHeaders(properties?: { [key: string]: any }): {
    [key: string]: string;
  } {
    if (!properties) return {};
    const headers: { [key: string]: string } = {};
    for (const key in properties) {
      headers[`Helicone-Property-${key}`] = properties[key].toString();
    }
    return headers;
  }

  private getCacheHeaders(cache?: boolean): { [key: string]: string } {
    return cache ? { "Helicone-Cache-Enabled": "true" } : {};
  }

  private getRetryHeaders(retry?: boolean | { [key: string]: any }): {
    [key: string]: string;
  } {
    if (!retry) return {};
    const headers: { [key: string]: string } = {
      "Helicone-Retry-Enabled": "true",
    };
    if (typeof retry === "object") {
      if (retry.num) headers["Helicone-Retry-Num"] = retry.num.toString();
      if (retry.factor)
        headers["Helicone-Retry-Factor"] = retry.factor.toString();
      if (retry.min_timeout)
        headers["Helicone-Retry-Min-Timeout"] = retry.min_timeout.toString();
      if (retry.max_timeout)
        headers["Helicone-Retry-Max-Timeout"] = retry.max_timeout.toString();
    }
    return headers;
  }

  private getRateLimitPolicyHeaders(
    rateLimitPolicy?: string | { [key: string]: any }
  ): { [key: string]: string } {
    if (!rateLimitPolicy) return {};
    let policy = "";
    if (typeof rateLimitPolicy === "string") {
      policy = rateLimitPolicy;
    } else if (typeof rateLimitPolicy === "object") {
      policy = `${rateLimitPolicy.quota};w=${rateLimitPolicy.time_window}`;
      if (rateLimitPolicy.segment) policy += `;s=${rateLimitPolicy.segment}`;
    } else {
      throw new TypeError(
        "rate_limit_policy must be either a string or a dictionary"
      );
    }
    return { "Helicone-RateLimit-Policy": policy };
  }
}

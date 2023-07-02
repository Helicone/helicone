import { IHeliconeConfigurationParameters } from "./IHeliconeConfigurationParameters";

export class HeaderBuilder {
  private heliconeConfigParameters: IHeliconeConfigurationParameters;
  private headers: { [key: string]: string } = {};

  constructor(heliconeConfigParameters: IHeliconeConfigurationParameters) {
    this.heliconeConfigParameters = heliconeConfigParameters;
    this.headers = {
      "Helicone-Auth": `Bearer ${heliconeConfigParameters.heliconeApiKey}`,
    };
  }

  withPropertiesHeader(): HeaderBuilder {
    this.headers = {
      ...this.headers,
      ...this.getPropertyHeaders(this.heliconeConfigParameters.heliconeMeta.properties),
    };
    return this;
  }

  withCacheHeader(): HeaderBuilder {
    this.headers = {
      ...this.headers,
      ...this.getCacheHeaders(this.heliconeConfigParameters.heliconeMeta.cache),
    };
    return this;
  }

  withRetryHeader(): HeaderBuilder {
    this.headers = {
      ...this.headers,
      ...this.getRetryHeaders(this.heliconeConfigParameters.heliconeMeta.retry),
    };
    return this;
  }

  withRateLimitPolicyHeader(): HeaderBuilder {
    this.headers = {
      ...this.headers,
      ...this.getRateLimitPolicyHeaders(this.heliconeConfigParameters.heliconeMeta.rateLimitPolicy),
    };
    return this;
  }

  withUserHeader(): HeaderBuilder {
    this.headers = {
      ...this.headers,
      ...this.getUserHeader(this.heliconeConfigParameters.heliconeMeta.user),
    };
    return this;
  }

  build(): { [key: string]: string } {
    return this.headers;
  }

  getHeliconeAuthHeader(): string {
    return this.headers["Helicone-Auth"];
  }

  getUserHeader(user?: string): { [key: string]: string } {
    return user ? { "Helicone-User-Id": user } : {};
  }

  getPropertyHeaders(properties?: { [key: string]: any }): {
    [key: string]: string;
  } {
    if (!properties) return {};
    const headers: { [key: string]: string } = {};
    for (const key in properties) {
      headers[`Helicone-Property-${key}`] = properties[key].toString();
    }
    return headers;
  }

  getCacheHeaders(cache?: boolean): { [key: string]: string } {
    return cache ? { "Helicone-Cache-Enabled": "true" } : {};
  }

  getRetryHeaders(retry?: boolean | { [key: string]: any }): {
    [key: string]: string;
  } {
    if (!retry) return {};
    const headers: { [key: string]: string } = {
      "Helicone-Retry-Enabled": "true",
    };
    if (typeof retry === "object") {
      if (retry.num) headers["Helicone-Retry-Num"] = retry.num.toString();
      if (retry.factor) headers["Helicone-Retry-Factor"] = retry.factor.toString();
      if (retry.min_timeout) headers["Helicone-Retry-Min-Timeout"] = retry.min_timeout.toString();
      if (retry.max_timeout) headers["Helicone-Retry-Max-Timeout"] = retry.max_timeout.toString();
    }
    return headers;
  }

  getRateLimitPolicyHeaders(rateLimitPolicy?: string | { [key: string]: any }): { [key: string]: string } {
    if (!rateLimitPolicy) return {};
    let policy = "";
    if (typeof rateLimitPolicy === "string") {
      policy = rateLimitPolicy;
    } else if (typeof rateLimitPolicy === "object") {
      policy = `${rateLimitPolicy.quota};w=${rateLimitPolicy.time_window}`;
      if (rateLimitPolicy.segment) policy += `;s=${rateLimitPolicy.segment}`;
    } else {
      throw new TypeError("rate_limit_policy must be either a string or a dictionary");
    }
    return { "Helicone-RateLimit-Policy": policy };
  }
}

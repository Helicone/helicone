import { Configuration as OpenAIConfiguration, OpenAIApi } from "openai";

interface HeliconeConfigurationOptions extends OpenAIConfiguration {
  heliconeApiKey?: string;
  properties?: { [key: string]: any };
  cache?: boolean;
  retry?: boolean | { [key: string]: any };
  rateLimitPolicy?: string | { [key: string]: any };
}

class Helicone {
  constructor(public heliconeApiKey: string | undefined) {
    if (!this.heliconeApiKey) {
      throw new Error("Helicone API key is not set as an environment variable.");
    }
  }

  getOpenAIApi(configuration: HeliconeConfigurationOptions): OpenAIApi {
    const heliconeHeaders = {
      "Helicone-Auth": `Bearer ${this.heliconeApiKey}`,
      ...this.getPropertyHeaders(configuration.properties),
      ...this.getCacheHeaders(configuration.cache),
      ...this.getRetryHeaders(configuration.retry),
      ...this.getRateLimitPolicyHeaders(configuration.rateLimitPolicy),
    };

    const mergedHeaders = {
      ...configuration.baseOptions.headers,
      ...heliconeHeaders,
    };

    const basePath = "https://oai.hconeai.com/v1";
    const mergedConfiguration = new OpenAIConfiguration({
      ...configuration,
      basePath,
      baseOptions: {
        ...configuration.baseOptions,
        headers: mergedHeaders,
      },
    });

    return new OpenAIApi(mergedConfiguration);
  }

  getPropertyHeaders(properties?: { [key: string]: any }): { [key: string]: string } {
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

  getRetryHeaders(retry?: boolean | { [key: string]: any }): { [key: string]: string } {
    if (!retry) return {};
    const headers: { [key: string]: string } = { "Helicone-Retry-Enabled": "true" };
    if (typeof retry === "object") {
      if (retry.num) headers["Helicone-Retry-Num"] = retry.num.toString();
      if (retry.factor) headers["Helicone-Retry-Factor"] = retry.factor.toString();
      if (retry.min_timeout)
        headers["Helicone-Retry-Min-Timeout"] = retry.min_timeout.toString();
      if (retry.max_timeout)
        headers["Helicone-Retry-Max-Timeout"] = retry.max_timeout.toString();
    }
    return headers;
  }

  getRateLimitPolicyHeaders(
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
      throw new TypeError("rate_limit_policy must be either a string or a dictionary");
    }
    return { "Helicone-RateLimit-Policy": policy };
  }
}
    
class Configuration extends OpenAIConfiguration {
  heliconeApiKey?: string;

  constructor(options: HeliconeConfigurationOptions) {
    super({ apiKey: options.apiKey });
    this.heliconeApiKey = options.heliconeApiKey;
  }
}

function HeliconeOpenAIApi(configuration: Configuration): OpenAIApi {
  const heliconeInstance = new Helicone(configuration.heliconeApiKey);
  return heliconeInstance.getOpenAIApi(configuration);
}

export {
  Configuration,
  HeliconeOpenAIApi as OpenAIApi,
};
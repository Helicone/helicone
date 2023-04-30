import {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionResponseMessageRoleEnum,
  CreateImageRequestSizeEnum,
  CreateImageRequestResponseFormatEnum,
  OpenAIApiAxiosParamCreator,
  OpenAIApiFp,
  OpenAIApiFactory,
  OpenAIApi as OpenAIApiOriginal,
  Configuration as OpenAIConfiguration,
} from "openai";

interface HeliconeConfigurationOptions {
  apiKey: string;
  heliconeApiKey?: string;
  properties?: { [key: string]: any };
  cache?: boolean;
  retry?: boolean | { [key: string]: any };
  rateLimitPolicy?: string | { [key: string]: any };
}

class HeliconeConfiguration extends OpenAIConfiguration {
  constructor(options: HeliconeConfigurationOptions) {
    super({ apiKey: options.apiKey });

    const heliconeHeaders = {
      "Helicone-Auth": `Bearer ${options.heliconeApiKey}`,
      ...getPropertyHeaders(options.properties),
      ...getCacheHeaders(options.cache),
      ...getRetryHeaders(options.retry),
      ...getRateLimitPolicyHeaders(options.rateLimitPolicy),
    };

    this.baseOptions = {
      ...this.baseOptions,
      headers: {
        ...this.baseOptions.headers,
        ...heliconeHeaders,
      },
    };
  }
}

function getPropertyHeaders(properties?: { [key: string]: any }): {
  [key: string]: string;
} {
  if (!properties) return {};
  const headers: { [key: string]: string } = {};
  for (const key in properties) {
    headers[`Helicone-Property-${key}`] = properties[key].toString();
  }
  return headers;
}

function getCacheHeaders(cache?: boolean): { [key: string]: string } {
  return cache ? { "Helicone-Cache-Enabled": "true" } : {};
}

function getRetryHeaders(retry?: boolean | { [key: string]: any }): {
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

function getRateLimitPolicyHeaders(
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

export {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionResponseMessageRoleEnum,
  CreateImageRequestSizeEnum,
  CreateImageRequestResponseFormatEnum,
  OpenAIApiAxiosParamCreator,
  OpenAIApiFp,
  OpenAIApiFactory,
  OpenAIApiOriginal as OpenAIApi,
  HeliconeConfiguration as Configuration,
};

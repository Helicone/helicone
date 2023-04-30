const {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionResponseMessageRoleEnum,
  CreateImageRequestSizeEnum,
  CreateImageRequestResponseFormatEnum,
  OpenAIApiAxiosParamCreator,
  OpenAIApiFp,
  OpenAIApiFactory,
  OpenAIApi: OpenAIApiOriginal,
  Configuration: OpenAIConfiguration,
} = require("openai");

class HeliconeConfiguration extends OpenAIConfiguration {
  constructor(options) {
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

function getPropertyHeaders(properties) {
  if (!properties) return {};
  const headers = {};
  for (const key in properties) {
    headers[`Helicone-Property-${key}`] = properties[key].toString();
  }
  return headers;
}

function getCacheHeaders(cache) {
  return cache ? { "Helicone-Cache-Enabled": "true" } : {};
}

function getRetryHeaders(retry) {
  if (!retry) return {};
  const headers = {
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

function getRateLimitPolicyHeaders(rateLimitPolicy) {
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

module.exports = {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionResponseMessageRoleEnum,
  CreateImageRequestSizeEnum,
  CreateImageRequestResponseFormatEnum,
  OpenAIApiAxiosParamCreator,
  OpenAIApiFp,
  OpenAIApiFactory,
  OpenAIApi: OpenAIApiOriginal,
  Configuration: HeliconeConfiguration,
};

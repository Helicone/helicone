"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configuration = exports.OpenAIApi = exports.OpenAIApiFactory = exports.OpenAIApiFp = exports.OpenAIApiAxiosParamCreator = exports.CreateImageRequestResponseFormatEnum = exports.CreateImageRequestSizeEnum = exports.ChatCompletionResponseMessageRoleEnum = exports.ChatCompletionRequestMessageRoleEnum = void 0;
const openai_1 = require("openai");
Object.defineProperty(exports, "ChatCompletionRequestMessageRoleEnum", { enumerable: true, get: function () { return openai_1.ChatCompletionRequestMessageRoleEnum; } });
Object.defineProperty(exports, "ChatCompletionResponseMessageRoleEnum", { enumerable: true, get: function () { return openai_1.ChatCompletionResponseMessageRoleEnum; } });
Object.defineProperty(exports, "CreateImageRequestSizeEnum", { enumerable: true, get: function () { return openai_1.CreateImageRequestSizeEnum; } });
Object.defineProperty(exports, "CreateImageRequestResponseFormatEnum", { enumerable: true, get: function () { return openai_1.CreateImageRequestResponseFormatEnum; } });
Object.defineProperty(exports, "OpenAIApiAxiosParamCreator", { enumerable: true, get: function () { return openai_1.OpenAIApiAxiosParamCreator; } });
Object.defineProperty(exports, "OpenAIApiFp", { enumerable: true, get: function () { return openai_1.OpenAIApiFp; } });
Object.defineProperty(exports, "OpenAIApiFactory", { enumerable: true, get: function () { return openai_1.OpenAIApiFactory; } });
Object.defineProperty(exports, "OpenAIApi", { enumerable: true, get: function () { return openai_1.OpenAIApi; } });
class HeliconeConfiguration extends openai_1.Configuration {
    constructor(options) {
        super({ apiKey: options.apiKey });
        const heliconeHeaders = Object.assign(Object.assign(Object.assign(Object.assign({ "Helicone-Auth": `Bearer ${options.heliconeApiKey}` }, getPropertyHeaders(options.properties)), getCacheHeaders(options.cache)), getRetryHeaders(options.retry)), getRateLimitPolicyHeaders(options.rateLimitPolicy));
        this.baseOptions = Object.assign(Object.assign({}, this.baseOptions), { headers: Object.assign(Object.assign({}, this.baseOptions.headers), heliconeHeaders) });
        this.basePath = "https://oai.hconeai.com/v1";
    }
}
exports.Configuration = HeliconeConfiguration;
function getPropertyHeaders(properties) {
    if (!properties)
        return {};
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
    if (!retry)
        return {};
    const headers = {
        "Helicone-Retry-Enabled": "true",
    };
    if (typeof retry === "object") {
        if (retry.num)
            headers["Helicone-Retry-Num"] = retry.num.toString();
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
    if (!rateLimitPolicy)
        return {};
    let policy = "";
    if (typeof rateLimitPolicy === "string") {
        policy = rateLimitPolicy;
    }
    else if (typeof rateLimitPolicy === "object") {
        policy = `${rateLimitPolicy.quota};w=${rateLimitPolicy.time_window}`;
        if (rateLimitPolicy.segment)
            policy += `;s=${rateLimitPolicy.segment}`;
    }
    else {
        throw new TypeError("rate_limit_policy must be either a string or a dictionary");
    }
    return { "Helicone-RateLimit-Policy": policy };
}

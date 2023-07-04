"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliconeHeaderBuilder = void 0;
class HeliconeHeaderBuilder {
    constructor(heliconeConfigParameters) {
        this.headers = {};
        this.heliconeConfigParameters = heliconeConfigParameters;
        this.headers = {
            "Helicone-Auth": `Bearer ${heliconeConfigParameters.heliconeApiKey}`,
        };
    }
    withPropertiesHeader() {
        this.headers = Object.assign(Object.assign({}, this.headers), this.getPropertyHeaders(this.heliconeConfigParameters.heliconeMeta.properties));
        return this;
    }
    withCacheHeader() {
        this.headers = Object.assign(Object.assign({}, this.headers), this.getCacheHeaders(this.heliconeConfigParameters.heliconeMeta.cache));
        return this;
    }
    withRetryHeader() {
        this.headers = Object.assign(Object.assign({}, this.headers), this.getRetryHeaders(this.heliconeConfigParameters.heliconeMeta.retry));
        return this;
    }
    withRateLimitPolicyHeader() {
        this.headers = Object.assign(Object.assign({}, this.headers), this.getRateLimitPolicyHeaders(this.heliconeConfigParameters.heliconeMeta.rateLimitPolicy));
        return this;
    }
    withUserHeader() {
        this.headers = Object.assign(Object.assign({}, this.headers), this.getUserHeader(this.heliconeConfigParameters.heliconeMeta.user));
        return this;
    }
    build() {
        return this.headers;
    }
    getUserHeader(user) {
        return user ? { "Helicone-User-Id": user } : {};
    }
    getPropertyHeaders(properties) {
        if (!properties)
            return {};
        const headers = {};
        for (const key in properties) {
            headers[`Helicone-Property-${key}`] = properties[key].toString();
        }
        return headers;
    }
    getCacheHeaders(cache) {
        return cache ? { "Helicone-Cache-Enabled": "true" } : {};
    }
    getRetryHeaders(retry) {
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
    getRateLimitPolicyHeaders(rateLimitPolicy) {
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
}
exports.HeliconeHeaderBuilder = HeliconeHeaderBuilder;

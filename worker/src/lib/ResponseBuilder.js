export class ResponseBuilder {
    headers = new Headers();
    setHeader(key, value) {
        this.headers.set(key, value);
        return this;
    }
    addRateLimitHeaders(rateLimitCheckResult, rateLimitOptions) {
        const policy = `${rateLimitOptions.quota};w=${rateLimitOptions.time_window};u=${rateLimitOptions.unit}`;
        const headers = {
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
    build(params) {
        const { body, inheritFrom: _inheritFrom } = params;
        let { status } = params;
        const inheritFrom = _inheritFrom ?? new Response();
        const headers = new Headers(inheritFrom.headers);
        this.headers.forEach((value, key) => {
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
    buildRateLimitedResponse() {
        this.setHeader("content-type", "application/json;charset=UTF-8");
        return this.build({
            body: JSON.stringify({
                message: "Helicone user was rate limit via Helicone-RateLimit-Policy header. Please wait before making more requests. See https://docs.helicone.ai/features/advanced-usage/custom-rate-limits for more details.",
            }),
            status: 429,
        });
    }
}

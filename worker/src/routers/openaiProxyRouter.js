import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
export const getOpenAIProxyRouter = (router) => {
    router.get("/helicone/test", async (_, requestWrapper, _env, _ctx) => {
        const properties = requestWrapper.heliconeHeaders.heliconeProperties;
        return new Response(JSON.stringify({
            test: "Hello World!",
            properties: {
                ...properties,
            },
        }), {
            headers: {
                "content-type": "application/json",
            },
        });
    });
    router.all("*", async (_, requestWrapper, env, ctx) => {
        if (requestWrapper.url.pathname.includes("audio")) {
            const new_url = new URL(`https://api.openai.com${requestWrapper.url.pathname}`);
            return await fetch(new_url.href, {
                method: requestWrapper.getMethod(),
                headers: requestWrapper.getHeaders(),
                body: requestWrapper.getBody(),
            });
        }
        return await proxyForwarder(requestWrapper, env, ctx, "OPENAI");
    });
    return router;
};

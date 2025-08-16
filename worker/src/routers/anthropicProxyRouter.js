import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
export const getAnthropicProxyRouter = (router) => {
    // proxy forwarder only
    router.all("*", async (_, requestWrapper, env, ctx) => {
        return await proxyForwarder(requestWrapper, env, ctx, "ANTHROPIC");
    });
    return router;
};

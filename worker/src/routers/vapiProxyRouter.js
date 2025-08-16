import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
export const getVapiProxyRouter = (router) => {
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
        return await proxyForwarder(requestWrapper, env, ctx, "VAPI");
    });
    return router;
};

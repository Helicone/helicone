import { Router, error } from "itty-router";
import { OpenAPIRouter, } from "@cloudflare/itty-router-openapi";
import { getAnthropicProxyRouter } from "./anthropicProxyRouter";
import { getAPIRouter } from "./api/apiRouter";
import { getOpenAIProxyRouter } from "./openaiProxyRouter";
import { handleFeedback } from "../lib/managers/FeedbackManager";
import { getGatewayAPIRouter } from "./gatewayRouter";
import { handleLoggingEndpoint } from "../lib/managers/PropertiesManager";
import { getGenerateRouter } from "./generateRouter";
import { getAIGatewayRouter } from "./aiGatewayRouter";
const WORKER_MAP = {
    ANTHROPIC_PROXY: getAnthropicProxyRouter,
    OPENAI_PROXY: getOpenAIProxyRouter,
    VAPI_PROXY: () => {
        throw new Error("VAPI_PROXY not implemented");
    },
    HELICONE_API: getAPIRouter,
    GATEWAY_API: getGatewayAPIRouter,
    GENERATE_API: getGenerateRouter,
    AI_GATEWAY_API: getAIGatewayRouter,
    CUSTOMER_GATEWAY: (router) => {
        router.all("*", async (_, requestWrapper, env, _ctx) => {
            let urlsObj = {};
            try {
                urlsObj = JSON.parse(env.CUSTOMER_GATEWAY_URL ?? "{}");
            }
            catch {
                console.error("Error in parsing urlsObj");
            }
            const baseHost = requestWrapper.url.host;
            if (!env.CUSTOMER_GATEWAY_URL) {
                return error(500, "CUSTOMER_GATEWAY_URL not set.");
            }
            if (!requestWrapper?.heliconeHeaders?.heliconeAuthV2?.token) {
                return error(500, "Invalid User");
            }
            const gatewayTarget = urlsObj?.[baseHost];
            if (!gatewayTarget) {
                return error(500, "Invalid Host");
            }
            requestWrapper.setBaseURLOverride(gatewayTarget);
        });
        return getOpenAIProxyRouter(router);
    },
};
function addBaseRoutes(router) {
    router.get("/healthcheck", async (_, _requestWrapper, _env, _ctx) => {
        return new Response(null, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    });
    router.post("/v1/feedback", async (_, requestWrapper, _env, _ctx) => {
        return await handleFeedback(requestWrapper);
    });
    router.options("/v1/feedback", async (_, _requestWrapper, _env, _ctx) => {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST",
                "Access-Control-Allow-Headers": "Content-Type, helicone-jwt",
            },
        });
    });
    router.post("/v1/log", async (_, requestWrapper, env, _ctx) => {
        return await handleLoggingEndpoint(requestWrapper, env);
    });
}
export function buildRouter(provider, includeCors) {
    if (provider === "HELICONE_API") {
        const router = OpenAPIRouter();
        addBaseRoutes(router);
        return WORKER_MAP[provider](router);
    }
    else {
        const router = Router();
        if (includeCors) {
            router.all("*", async (_, __, ___) => {
                return new Response(null, {
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "*",
                        "Access-Control-Allow-Headers": "*",
                    },
                });
            });
        }
        addBaseRoutes(router);
        return WORKER_MAP[provider](router);
    }
}

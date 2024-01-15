import { IRequest, Route, Router, RouterType, error } from "itty-router";
import {
  OpenAPIRouter,
  OpenAPIRouterType,
} from "@cloudflare/itty-router-openapi";

import { Env } from "..";
import { RequestWrapper } from "../lib/RequestWrapper";
import { getAnthropicProxyRouter } from "./anthropicProxyRouter";
import { getAPIRouter } from "./api/apiRouter";
import { getOpenAIProxyRouter } from "./openaiProxyRouter";
import { handleFeedback } from "../feedback";
import { getGatewayAPIRouter } from "./gatewayRouter";
import { handleLoggingEndpoint } from "../properties";

export type BaseRouter = RouterType<
  Route,
  [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
>;

export type BaseOpenAPIRouter = OpenAPIRouterType<
  Route,
  [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
>;

const WORKER_MAP: Omit<
  {
    [key in Env["WORKER_TYPE"]]: (router: BaseRouter) => BaseRouter;
  },
  "HELICONE_API"
> & {
  HELICONE_API: (router: OpenAPIRouterType) => OpenAPIRouterType;
} = {
  ANTHROPIC_PROXY: getAnthropicProxyRouter,
  OPENAI_PROXY: getOpenAIProxyRouter,
  HELICONE_API: getAPIRouter,
  GATEWAY_API: getGatewayAPIRouter,
  CUSTOMER_GATEWAY: (router: BaseRouter) => {
    router.all(
      "*",
      async (
        _,
        requestWrapper: RequestWrapper,
        env: Env,
        _ctx: ExecutionContext
      ) => {
        console.log("CUSTOMER_GATEWAY", requestWrapper?.heliconeProxyKeyId);
        if (!env.CUSTOMER_GATEWAY_URL) {
          return error(500, "CUSTOMER_GATEWAY_URL not set.");
        }

        if (!requestWrapper?.heliconeProxyKeyId) {
          return error(401, "Invalid user.");
        }
        requestWrapper.setBaseURLOverride(env.CUSTOMER_GATEWAY_URL);
      }
    );
    return getOpenAIProxyRouter(router);
  },
};

function addBaseRoutes(router: BaseRouter | BaseOpenAPIRouter): void {
  router.post(
    "/v1/feedback",
    async (
      _: unknown,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      return await handleFeedback(requestWrapper, env);
    }
  );

  router.options(
    "/v1/feedback",
    async (
      _: unknown,
      _requestWrapper: RequestWrapper,
      _env: Env,
      _ctx: ExecutionContext
    ) => {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, helicone-jwt",
        },
      });
    }
  );

  router.post(
    "/v1/log",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      return await handleLoggingEndpoint(requestWrapper, env);
    }
  );
}

export function buildRouter(
  provider: Env["WORKER_TYPE"]
): BaseRouter | BaseOpenAPIRouter {
  if (provider === "HELICONE_API") {
    const router = OpenAPIRouter<
      IRequest,
      [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
    >();
    addBaseRoutes(router);
    return WORKER_MAP[provider](router);
  } else {
    const router = Router<
      IRequest,
      [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
    >();
    addBaseRoutes(router);
    return WORKER_MAP[provider](router);
  }
}

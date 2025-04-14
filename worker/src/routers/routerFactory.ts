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
import { handleFeedback } from "../lib/managers/FeedbackManager";
import { getGatewayAPIRouter } from "./gatewayRouter";
import { handleLoggingEndpoint } from "../lib/managers/PropertiesManager";
import { getGenerateRouter } from "./generateRouter";

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
  GENERATE_API: getGenerateRouter,
  CUSTOMER_GATEWAY: (router: BaseRouter) => {
    router.all(
      "*",
      async (
        _,
        requestWrapper: RequestWrapper,
        env: Env,
        _ctx: ExecutionContext
      ) => {
        let urlsObj: {
          [key: string]: string;
        } = {};
        try {
          urlsObj = JSON.parse(env.CUSTOMER_GATEWAY_URL ?? "{}");
        } catch {
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
      }
    );
    return getOpenAIProxyRouter(router);
  },
};

function addBaseRoutes(router: BaseRouter | BaseOpenAPIRouter): void {
  router.get(
    "/healthcheck",
    async (
      _,
      _requestWrapper: RequestWrapper,
      _env: Env,
      _ctx: ExecutionContext
    ) => {
      return new Response(null, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  );

  router.post(
    "/v1/feedback",
    async (
      _: unknown,
      requestWrapper: RequestWrapper,
      _env: Env,
      _ctx: ExecutionContext
    ) => {
      return await handleFeedback(requestWrapper);
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
  provider: Env["WORKER_TYPE"],
  includeCors: boolean
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

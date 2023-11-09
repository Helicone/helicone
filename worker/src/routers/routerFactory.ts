/* eslint-disable @typescript-eslint/no-unused-vars */
import { IRequest, Route, Router, RouterType } from "itty-router";
import { Env } from "..";
import { RequestWrapper } from "../lib/RequestWrapper";
import { handleLoggingEndpoint } from "../properties";
import { getAnthropicProxyRouter } from "./anthropicProxyRouter";
import { getAPIRouter } from "./apiRouter";
import { getOpenAIProxyRouter } from "./openaiProxyRouter";
import { handleFeedback } from "../feedback";

export type BaseRouter = RouterType<
  Route,
  [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
>;

const WORKER_MAP: {
  [key in Env["WORKER_TYPE"]]: (router: BaseRouter) => BaseRouter;
} = {
  ANTHROPIC_PROXY: getAnthropicProxyRouter,
  OPENAI_PROXY: getOpenAIProxyRouter,
  HELICONE_API: getAPIRouter,
};

export function buildRouter(provider: Env["WORKER_TYPE"]): BaseRouter {
  const router = Router<
    IRequest,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >();

  router.post(
    "/v1/feedback",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return await handleFeedback(requestWrapper, env);
    }
  );

  router.options(
    "/v1/feedback",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
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

  // Call worker specific router AFTER the generic router
  WORKER_MAP[provider](router);

  //TODO remove this
  router.post(
    "/v1/log",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return await handleLoggingEndpoint(requestWrapper, env);
    }
  );

  return router;
}

import { Route, RouterType } from "itty-router";
import { Env } from "..";
import { handleFeedbackEndpoint } from "../feedback";
import { RequestWrapper } from "../lib/RequestWrapper";
import { handleLoggingEndpoint } from "../properties";
import { getAnthropicProxyRouter } from "./anthropicProxyRouter";
import { getAPIRouter } from "./apiRouter";
import { getOpenAIProxyRouter } from "./openaiProxyRouter";

type BaseRouter = RouterType<Route, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>;

const WORKER_MAP: {
  [key in Env["WORKER_TYPE"]]: () => BaseRouter;
} = {
  ANTHROPIC_PROXY: getAnthropicProxyRouter,
  OPENAI_PROXY: getOpenAIProxyRouter,
  HELICONE_API: getAPIRouter,
};

export function buildRouter(provider: Env["WORKER_TYPE"]): BaseRouter {
  const router = WORKER_MAP[provider]();
  console.log("provider", provider);
  // console.log("router", router);

  router.get("/helicone/test", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
    const properties = requestWrapper.heliconeHeaders.heliconeProperties;
    return new Response(
      JSON.stringify({
        test: "Hello World!",
        properties: {
          ...properties,
        },
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
  });

  //TODO remove this
  router.post("/v1/log", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
    return await handleLoggingEndpoint(requestWrapper, env);
  });

  //TODO remove this
  router.post("/v1/feedback", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
    return await handleFeedbackEndpoint(requestWrapper, env);
  });

  return router;
}

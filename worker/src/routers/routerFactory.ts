import { Route, RouterType } from "itty-router";
import { Env, Provider } from "..";
import { handleFeedbackEndpoint } from "../feedback";
import { RequestWrapper } from "../lib/RequestWrapper";
import { handleLoggingEndpoint } from "../properties";
import { getOpenAIRouter } from "./oaiRouter";
import { getAnthropicRouter } from "./anthropicRouter";

export function buildRouter(
  provider: Env["PROVIDER"]
): RouterType<Route, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]> {
  const router = getProviderRouter(provider);

  router.post("/v1/log", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
    return await handleLoggingEndpoint(requestWrapper, env);
  });

  router.post("/v1/feedback", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
    return await handleFeedbackEndpoint(requestWrapper, env);
  });

  return router;
}

export function getProviderRouter(
  provider: Env["PROVIDER"]
): RouterType<Route, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]> {
  if (provider === Provider.ANTHROPIC) {
    return getAnthropicRouter();
  }

  if (provider === Provider.OPENAI) {
    return getOpenAIRouter();
  }
  throw new Error("Provider not found");
}

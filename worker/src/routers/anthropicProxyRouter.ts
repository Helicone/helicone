import { IRequest, Router } from "itty-router";
import { Env } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";

export const getAnthropicProxyRouter = () => {
  const anthropicRouter = Router<
    IRequest,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >();

  // proxy forwarder only
  anthropicRouter.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return await proxyForwarder(requestWrapper, env, ctx, "ANTHROPIC");
    }
  );

  return anthropicRouter;
};

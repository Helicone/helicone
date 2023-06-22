import { Env } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { Router, IRequest } from "itty-router";

const anthropicRouter = Router<IRequest, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>();

// proxy forwarder only
anthropicRouter.all("*", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  return await proxyForwarder(requestWrapper, env, ctx);
});

export default anthropicRouter;

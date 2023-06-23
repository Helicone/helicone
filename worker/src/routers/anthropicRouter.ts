import { Env } from "..";
import { HeliconeHeaders } from "../lib/HeliconeHeaders";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { Router, IRequest } from "itty-router";
import { AsyncLogModel } from "../lib/models/AsyncLog";
import { dbLoggableRequestFromAsyncLogModel } from "../lib/dbLogger/DBLoggable";
import { ClickhouseClientWrapper } from "../lib/db/clickhouse";
import { createClient } from "@supabase/supabase-js";

const anthropicRouter = Router<IRequest, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>();

anthropicRouter.post("/anthropic/v1/log", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  const asyncLogModel = await requestWrapper.getJson<AsyncLogModel>();

  const requestHeaders = new Headers(asyncLogModel.providerRequest.headers);
  const responseHeaders = new Headers(asyncLogModel.providerResponse.headers);
  const heliconeHeaders = new HeliconeHeaders(requestHeaders);

  const loggable = await dbLoggableRequestFromAsyncLogModel(requestWrapper, env, asyncLogModel, heliconeHeaders, responseHeaders);

  ctx.waitUntil(
    loggable.log({
      clickhouse: new ClickhouseClientWrapper(env),
      supabase: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
    })
  );
});

// proxy forwarder only
anthropicRouter.all("*", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  return await proxyForwarder(requestWrapper, env, ctx);
});

export default anthropicRouter;
import { Env } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { Router, IRequest } from "itty-router";
import { dbLoggableRequestFromAsyncLogModel } from "../lib/dbLogger/DBLoggable";
import { HeliconeHeaders } from "../lib/HeliconeHeaders";
import { ClickhouseClientWrapper } from "../lib/db/clickhouse";
import { createClient } from "@supabase/supabase-js";
import { AsyncLogModel } from "../lib/models/AsyncLog";

const oaiRouter = Router<IRequest, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>();

oaiRouter.post("/oai/v1/log", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
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

// Proxy only + proxy forwarder
oaiRouter.all("*", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  if (requestWrapper.url.pathname.includes("audio")) {
    const new_url = new URL(`https://api.openai.com${requestWrapper.url.pathname}`);
    return await fetch(new_url.href, {
      method: requestWrapper.getMethod(),
      headers: requestWrapper.getHeaders(),
      body: requestWrapper.getBody(),
    });
  }

  return await proxyForwarder(requestWrapper, env, ctx);
});

export default oaiRouter;

import { createClient } from "@supabase/supabase-js";
import { IRequest, Router } from "itty-router";
import { Env } from "..";
import { HeliconeHeaders } from "../lib/HeliconeHeaders";
import { RequestWrapper } from "../lib/RequestWrapper";
import { ClickhouseClientWrapper } from "../lib/db/clickhouse";
import { dbLoggableRequestFromAsyncLogModel } from "../lib/dbLogger/DBLoggable";
import { AsyncLogModel, validateAsyncLogModel } from "../lib/models/AsyncLog";
import { DatabaseExecutor } from "../lib/db/postgres";

export const getAPIRouter = () => {
  const apiRouter = Router<
    IRequest,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >();

  apiRouter.post(
    "/oai/v1/log",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      const asyncLogModel = await requestWrapper.getJson<AsyncLogModel>();
      //TODO Check to make sure auth is correct
      if (
        !requestWrapper.getAuthorization() ||
        !requestWrapper.heliconeHeaders.heliconeAuth
      ) {
        return new Response("Unauthorized", { status: 401 });
      }

      const [isValid, error] = validateAsyncLogModel(asyncLogModel);
      if (!isValid) {
        console.error("Invalid asyncLogModel", error);
        return new Response(JSON.stringify({ error }), { status: 400 });
      }

      const requestHeaders = new Headers(asyncLogModel.providerRequest.meta);
      const responseHeaders = new Headers(
        asyncLogModel.providerResponse.headers
      );
      const heliconeHeaders = new HeliconeHeaders(requestHeaders);

      const loggable = await dbLoggableRequestFromAsyncLogModel({
        requestWrapper,
        env,
        asyncLogModel,
        providerRequestHeaders: heliconeHeaders,
        providerResponseHeaders: responseHeaders,
        provider: "OPENAI",
      });
      const { error: logError } = await loggable.log({
        clickhouse: new ClickhouseClientWrapper(env),
        supabase: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
        postgres: new DatabaseExecutor(env, ctx),
      });

      if (logError !== null) {
        return new Response(JSON.stringify({ error: logError }), {
          status: 500,
        });
      }

      return new Response("ok", { status: 200 });
    }
  );

  apiRouter.post(
    "/anthropic/v1/log",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      const asyncLogModel = await requestWrapper.getJson<AsyncLogModel>();

      if (
        !requestWrapper.getAuthorization() ||
        !requestWrapper.heliconeHeaders.heliconeAuth
      ) {
        return new Response("Unauthorized", { status: 401 });
      }

      const requestHeaders = new Headers(asyncLogModel.providerRequest.meta);
      const responseHeaders = new Headers(
        asyncLogModel.providerResponse.headers
      );
      const heliconeHeaders = new HeliconeHeaders(requestHeaders);

      const loggable = await dbLoggableRequestFromAsyncLogModel({
        requestWrapper,
        env,
        asyncLogModel,
        providerRequestHeaders: heliconeHeaders,
        providerResponseHeaders: responseHeaders,
        provider: "OPENAI",
      });

      const { error: logError } = await loggable.log({
        clickhouse: new ClickhouseClientWrapper(env),
        supabase: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
        postgres: new DatabaseExecutor(env, ctx),
      });

      if (logError !== null) {
        return new Response(JSON.stringify({ error: logError }), {
          status: 500,
        });
      }

      return new Response("ok", { status: 200 });
    }
  );

  // Proxy only + proxy forwarder
  apiRouter.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return new Response("invalid path", { status: 400 });
    }
  );

  return apiRouter;
};

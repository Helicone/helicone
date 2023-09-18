import { createClient } from "@supabase/supabase-js";
import { Env } from "..";
import { HeliconeHeaders } from "../lib/HeliconeHeaders";
import { RequestWrapper } from "../lib/RequestWrapper";
import { ClickhouseClientWrapper } from "../lib/db/clickhouse";
import { dbLoggableRequestFromAsyncLogModel } from "../lib/dbLogger/DBLoggable";
import { AsyncLogModel, validateAsyncLogModel } from "../lib/models/AsyncLog";
import { BaseRouter } from "./routerFactory";
import { InsertQueue } from "../lib/dbLogger/insertQueue";
import { Run, isValidStatus, validateRun } from "../lib/models/Runs";
import { Database } from "../../supabase/database.types";
import { SupabaseWrapper } from "../lib/db/supabase";
import { Result } from "../results";
import { Task, validateTask } from "../lib/models/Tasks";

// TODO Move to API middleware so that it is always constructed
class APIClient {
  public queue: InsertQueue;
  private supabase: SupabaseWrapper;
  private heliconeApiKeyRow?: Database["public"]["Tables"]["helicone_api_keys"]["Row"];

  constructor(private env: Env, private requestWrapper: RequestWrapper) {
    this.supabase = new SupabaseWrapper(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.queue = new InsertQueue(
      this.supabase.client,
      env.FALLBACK_QUEUE,
      env.REQUEST_AND_RESPONSE_QUEUE_KV
    );
  }

  async getHeliconeApiKeyRow(): Promise<
    Database["public"]["Tables"]["helicone_api_keys"]["Row"]
  > {
    if (this.heliconeApiKeyRow) {
      return this.heliconeApiKeyRow;
    }
    const { data, error } = await this.supabase.getHeliconeApiKeyRow(
      await this.requestWrapper.getProviderAuthHeader()
    );
    if (error || !data) {
      throw new Error("Could not get helicone api key row");
    }

    return data;
  }

  async isAuthorized(): Promise<boolean> {
    try {
      await this.getHeliconeApiKeyRow();
    } catch (e) {
      return false;
    }
    return true;
  }
}

type Provider = "OPENAI" | "ANTHROPIC" | "CUSTOM";

async function logAsync(
  requestWrapper: RequestWrapper,
  env: Env,
  ctx: ExecutionContext,
  provider: Provider
): Promise<Response> {
  const asyncLogModel = await requestWrapper.getJson<AsyncLogModel>();
  // if payload is larger than 10MB, return 400
  const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024;
  if (JSON.stringify(asyncLogModel).length > MAX_PAYLOAD_SIZE) {
    return new Response("Payload too large", { status: 400 });
  }
  if (!requestWrapper.getAuthorization()) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [isValid, error] = validateAsyncLogModel(asyncLogModel);
  if (!isValid) {
    console.error("Invalid asyncLogModel", error);
    return new Response(JSON.stringify({ error }), { status: 400 });
  }

  const requestHeaders = new Headers(asyncLogModel.providerRequest.meta);
  const responseHeaders = new Headers(asyncLogModel.providerResponse.headers);
  const heliconeHeaders = new HeliconeHeaders(requestHeaders);

  const loggable = await dbLoggableRequestFromAsyncLogModel({
    requestWrapper,
    env,
    asyncLogModel,
    providerRequestHeaders: heliconeHeaders,
    providerResponseHeaders: responseHeaders,
    provider: provider,
  });
  const { error: logError } = await loggable.log(
    {
      clickhouse: new ClickhouseClientWrapper(env),
      supabase: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
      queue: new InsertQueue(
        createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
        env.FALLBACK_QUEUE,
        env.REQUEST_AND_RESPONSE_QUEUE_KV
      ),
    },
    env.RATE_LIMIT_KV
  );

  if (logError !== null) {
    return new Response(JSON.stringify({ error: logError }), {
      status: 200,
    });
  }

  return new Response("ok", { status: 200 });
}

export const getAPIRouter = (router: BaseRouter) => {
  router.post(
    "/run",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      const client = new APIClient(env, requestWrapper);
      if (!(await client.isAuthorized())) {
        return new Response("Unauthorized", { status: 401 });
      }
      const run = await requestWrapper.getJson<Run>();

      if (!run) {
        return new Response("Invalid run", { status: 400 });
      }
      const isValidRun = validateRun(run);

      if (isValidRun.error) {
        return new Response(JSON.stringify(isValidRun), {
          status: 400,
        });
      }

      const { data, error } = await client.queue.addJob({
        custom_properties: run.customProperties ?? {},
        description: run.description ?? "",
        name: run.name ?? "",
        timeout_seconds: run.timeoutSeconds ?? 60,
        status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: run.id ?? crypto.randomUUID(),
        org_id: (await client.getHeliconeApiKeyRow()).organization_id,
      });
      if (error) {
        return new Response(JSON.stringify({ error }), { status: 500 });
      }
      return new Response(JSON.stringify({ data }), { status: 200 });
    }
  );

  router.patch(
    "/run/:id/status",
    async (
      { params: { id } },
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      const client = new APIClient(env, requestWrapper);
      if (!(await client.isAuthorized())) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { data: run, error: runError } = await client.queue.getJobById(id);

      if (runError) {
        return new Response(JSON.stringify({ error: runError }), {
          status: 500,
        });
      }
      if (!run) {
        console.error("Run not found", id);
        return new Response(JSON.stringify({ error: "Run not found" }), {
          status: 404,
        });
      }

      if (
        run?.org_id !== (await client.getHeliconeApiKeyRow()).organization_id
      ) {
        return new Response("Unauthorized", { status: 401 });
      }
      const status =
        (await requestWrapper.getJson<{ status: string }>()).status ?? "";

      if (!isValidStatus(status)) {
        console.error("Invalid status", status);
        return new Response(JSON.stringify({ error: "Invalid status" }), {
          status: 400,
        });
      }

      const { data, error } = await client.queue.updateRunStatus(id, status);
      if (error) {
        return new Response(JSON.stringify({ error }), { status: 500 });
      }
      return new Response(JSON.stringify({ data }), { status: 200 });
    }
  );

  router.post(
    "/task",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      const client = new APIClient(env, requestWrapper);
      if (!(await client.isAuthorized())) {
        return new Response("Unauthorized", { status: 401 });
      }
      const task = await requestWrapper.getJson<Task>();
      if (!task) {
        console.error("Invalid task", task);
        return new Response("Invalid task", { status: 400 });
      }
      const isValidTask = validateTask(task);

      if (isValidTask.error) {
        console.error("Invalid task", isValidTask);
        return new Response(JSON.stringify(isValidTask), {
          status: 400,
        });
      }

      const { data, error } = await client.queue.addTask({
        custom_properties: task.customProperties ?? {},
        description: task.description ?? "",
        name: task.name ?? "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: task.id ?? crypto.randomUUID(),
        org_id: (await client.getHeliconeApiKeyRow()).organization_id,
        job: task.job,
      });
      if (error) {
        return new Response(JSON.stringify({ error }), { status: 500 });
      }
      return new Response(JSON.stringify({ data }), { status: 200 });
    }
  );

  router.post(
    "/custom/v1/log",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return await logAsync(requestWrapper, env, ctx, "CUSTOM");
    }
  );
  router.post(
    "/oai/v1/log",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return await logAsync(requestWrapper, env, ctx, "OPENAI");
    }
  );

  router.post(
    "/anthropic/v1/log",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return await logAsync(requestWrapper, env, ctx, "ANTHROPIC");
    }
  );

  // Proxy only + proxy forwarder
  router.all(
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

  return router;
};

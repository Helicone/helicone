import { createClient } from "@supabase/supabase-js";
import { Env, Provider } from "..";
import { Database, Json } from "../../supabase/database.types";
import { DBWrapper, HeliconeAuth } from "../db/DBWrapper";
import { HeliconeHeaders } from "../lib/HeliconeHeaders";
import { RequestWrapper } from "../lib/RequestWrapper";
import { ClickhouseClientWrapper } from "../lib/db/clickhouse";
import { Valhalla } from "../lib/db/valhalla";
import { dbLoggableRequestFromAsyncLogModel } from "../lib/dbLogger/DBLoggable";
import { InsertQueue } from "../lib/dbLogger/insertQueue";
import { AsyncLogModel, validateAsyncLogModel } from "../lib/models/AsyncLog";
import { Job, isValidStatus, validateRun } from "../lib/models/Runs";
import { HeliconeNode, validateHeliconeNode } from "../lib/models/Tasks";
import { validateAlertCreate } from "../lib/validators/alertValidators";
import { BaseRouter } from "./routerFactory";

class InternalResponse {
  constructor(private client: APIClient) {}

  newError(message: string, status: number): Response {
    console.error(`Response Error: `, message);
    return new Response(JSON.stringify({ error: message }), { status });
  }

  successJSON(data: unknown, enableCors = false): Response {
    if (enableCors) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "content-type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT",
          "Access-Control-Allow-Headers":
            "Content-Type, helicone-jwt, helicone-org-id",
        },
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  }

  unauthorized(): Response {
    return this.newError("Unauthorized", 401);
  }
}

// TODO Move to API middleware so that it is always constructed

async function createAPIClient(env: Env, requestWrapper: RequestWrapper) {
  const auth = await requestWrapper.auth();
  if (auth.error !== null) {
    throw new Error(auth.error);
  }
  return new APIClient(env, requestWrapper, auth.data);
}
class APIClient {
  public queue: InsertQueue;
  public response: InternalResponse;
  db: DBWrapper;
  private heliconeApiKeyRow?: Database["public"]["Tables"]["helicone_api_keys"]["Row"];

  constructor(
    private env: Env,
    private requestWrapper: RequestWrapper,
    auth: HeliconeAuth
  ) {
    this.response = new InternalResponse(this);
    this.db = new DBWrapper(env, auth);
    this.queue = new InsertQueue(
      createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
      new Valhalla(env.VALHALLA_URL, auth),
      new ClickhouseClientWrapper(env),
      env.FALLBACK_QUEUE,
      env.REQUEST_AND_RESPONSE_QUEUE_KV
    );
  }
}

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

  const { data: auth, error: authError } = await requestWrapper.auth();
  if (authError !== null) {
    return new Response(JSON.stringify({ error: authError }), {
      status: 401,
    });
  }
  const { error: logError } = await loggable.log({
    clickhouse: new ClickhouseClientWrapper(env),
    supabase: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
    dbWrapper: new DBWrapper(env, auth),
    queue: new InsertQueue(
      createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
      new Valhalla(env.VALHALLA_URL, auth),
      new ClickhouseClientWrapper(env),
      env.FALLBACK_QUEUE,
      env.REQUEST_AND_RESPONSE_QUEUE_KV
    ),
  });

  if (logError !== null) {
    return new Response(JSON.stringify({ error: logError }), {
      status: 200,
    });
  }

  return new Response("ok", {
    status: 200,
    headers: { "helicone-id": heliconeHeaders.requestId ?? "" },
  });
}

export const getAPIRouter = (router: BaseRouter) => {
  router.post(
    "/job",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, requestWrapper);
      const authParams = await client.db.getAuthParams();
      if (authParams.error !== null) {
        return client.response.unauthorized();
      }
      const job = await requestWrapper.getJson<Job>();

      if (!job) {
        return client.response.newError("Invalid run", 400);
      }
      const isValidRun = validateRun(job);

      if (isValidRun.error) {
        return client.response.newError(isValidRun.error, 400);
      }

      const { data, error } = await client.queue.addJob({
        custom_properties: job.customProperties ?? {},
        description: job.description ?? "",
        name: job.name ?? "",
        timeout_seconds: job.timeoutSeconds ?? 60,
        status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id: job.id ?? crypto.randomUUID(),
        org_id: authParams.data?.organizationId,
      });
      if (error) {
        return client.response.newError(error, 500);
      }
      return client.response.successJSON({ data });
    }
  );

  router.patch(
    "/job/:id/status",
    async (
      { params: { id } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, requestWrapper);
      const authParams = await client.db.getAuthParams();
      if (authParams.error !== null) {
        return client.response.unauthorized();
      }

      const { data: job, error: jobError } = await client.db.getJobById(id);

      if (jobError) {
        return client.response.newError(jobError, 500);
      }

      if (!job) {
        return client.response.newError("Job not found", 404);
      }

      if (job?.org_id !== authParams.data.organizationId) {
        return client.response.unauthorized();
      }

      const status =
        (await requestWrapper.getJson<{ status: string }>()).status ?? "";

      if (!isValidStatus(status)) {
        return client.response.newError("Invalid status", 400);
      }

      const { data, error } = await client.queue.updateJobStatus(id, status);
      if (error) {
        return client.response.newError(error, 500);
      }

      return client.response.successJSON({ data });
    }
  );

  router.post(
    "/node",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, requestWrapper);
      const authParams = await client.db.getAuthParams();
      if (authParams.error !== null) {
        return client.response.unauthorized();
      }

      const node = await requestWrapper.getJson<HeliconeNode>();
      if (!node) {
        return client.response.newError("Invalid task", 400);
      }

      const isValidTask = validateHeliconeNode(node);

      if (isValidTask.error) {
        return client.response.newError(isValidTask.error, 400);
      }

      const { data, error } = await client.queue.addNode(
        {
          custom_properties: node.customProperties ?? {},
          description: node.description ?? "",
          name: node.name ?? "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          id: node.id ?? crypto.randomUUID(),
          org_id: authParams.data.organizationId,
          job: node.job,
        },
        { parent_job_id: node.parentJobId }
      );
      if (error) {
        return client.response.newError(error, 500);
      }
      return client.response.successJSON({ data });
    }
  );

  router.patch(
    "/node/:id/status",
    async (
      { params: { id } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, requestWrapper);
      const authParams = await client.db.getAuthParams();
      if (authParams.error !== null) {
        return client.response.unauthorized();
      }

      const { data: job, error: jobError } = await client.db.getNodeById(id);

      if (jobError) {
        return client.response.newError(jobError, 500);
      }

      if (!job) {
        return client.response.newError("Node not found", 404);
      }

      if (job?.org_id !== authParams.data.organizationId) {
        return client.response.unauthorized();
      }

      const status =
        (await requestWrapper.getJson<{ status: string }>()).status ?? "";

      if (!isValidStatus(status)) {
        return client.response.newError("Invalid status", 400);
      }

      const { data, error } = await client.queue.updateNodeStatus(id, status);
      if (error) {
        return client.response.newError(error, 500);
      }

      return client.response.successJSON({ data });
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

  router.put(
    "/v1/request/:id/property",
    async (
      { params: { id } },
      requestWrapper: RequestWrapper,
      env: Env,
      _: ExecutionContext
    ) => {
      const client = await createAPIClient(env, requestWrapper);
      const authParams = await client.db.getAuthParams();
      if (authParams.error !== null) {
        return client.response.unauthorized();
      }

      interface Body {
        key: string;
        value: string;
      }

      const { data, error } = await client.db.getRequestById(id);
      if (error) {
        return client.response.newError(error, 500);
      }

      if (!data) {
        return client.response.newError("Request not found.", 404);
      }

      const property = await requestWrapper.getJson<Body>();
      if (!property) {
        return client.response.newError("Request body is missing.", 400);
      }

      if (!property.key) {
        return client.response.newError(
          "Invalid request body. 'key' is required.",
          400
        );
      }

      if (!property.value) {
        return client.response.newError(
          "Invalid request body. 'value' is required.",
          400
        );
      }

      const properties = {
        ...((data?.properties as Record<string, Json>) || {}),
        [property.key]: property.value,
      };

      await client.queue.putRequestProperty(
        id,
        properties,
        property,
        authParams.data.organizationId,
        data
      );
      return client.response.successJSON({ ok: "true" }, true);
    }
  );

  router.post(
    "/alerts",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, requestWrapper);
      const { data: authParams, error: authError } =
        await client.db.getAuthParams();

      if (authError !== null) {
        return client.response.unauthorized();
      }

      const requestData = await requestWrapper.getJson<
        Database["public"]["Tables"]["alert"]["Insert"]
      >();

      const alert = {
        ...requestData,
        status: "resolved",
        org_id: authParams.organizationId,
      };

      const { error: validateError } = validateAlertCreate(alert);
      if (validateError !== null) {
        return client.response.newError(validateError, 400);
      }

      const { data: alertRow, error: alertError } = await client.db.insertAlert(
        alert
      );

      if (alertError || !alertRow) {
        return client.response.newError(alertError, 500);
      }

      return client.response.successJSON({ ok: "true" }, true);
    }
  );

  router.delete(
    "/alert/:id",
    async ({ params: { id } }, requestWrapper: RequestWrapper, env: Env) => {
      const client = await createAPIClient(env, requestWrapper);
      const { data: authParams, error } = await client.db.getAuthParams();

      if (error !== null) {
        return client.response.unauthorized();
      }

      const { error: deleteErr } = await client.db.deleteAlert(
        id,
        authParams.organizationId
      );

      if (deleteErr) {
        return client.response.newError(deleteErr, 500);
      }

      return client.response.successJSON({ ok: "true" }, true);
    }
  );

  router.options(
    "*",
    async (
      _,
      _requestWrapper: RequestWrapper,
      _env: Env,
      _ctx: ExecutionContext
    ) => {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, POST, GET, PUT",
          "Access-Control-Allow-Headers":
            "Content-Type, helicone-jwt, helicone-org-id",
        },
      });
    }
  );

  // Proxy only + proxy forwarder
  router.all(
    "*",
    async (
      _,
      _requestWrapper: RequestWrapper,
      _env: Env,
      _ctx: ExecutionContext
    ) => {
      return new Response("invalid path", { status: 400 });
    }
  );

  return router;
};

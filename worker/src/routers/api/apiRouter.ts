import { Env } from "../..";
import { Database, Json } from "../../../supabase/database.types";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { Job, isValidStatus, validateRun } from "../../lib/models/Runs";
import { HeliconeNode, validateHeliconeNode } from "../../lib/models/Tasks";
import { validateAlertCreate } from "../../lib/validators/alertValidators";

import { OpenAPIRouterType } from "@cloudflare/itty-router-openapi";
import { Route } from "itty-router";
import { logAsync } from "../../api/helpers/logAsync";
import { createAPIClient } from "../../api/lib/apiClient";
import { CustomersGet } from "../../api/routes/customer-portal/customers/get";

export const getAPIRouter = (
  router: OpenAPIRouterType<
    Route,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post("/api/tasks/:taskSlug/", CustomersGet as any);

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

  router.post(
    "/v1/organizations/:id/logo",
    async (_, requestWrapper: RequestWrapper, env: Env) => {
      const { error: formDataErr, data: formData } =
        await requestWrapper.getFormData();

      if (formDataErr || !formData) {
        return new Response("Expected a POST request with a logo file", {
          status: 400,
        });
      }

      const logoFile = formData.get("logo") as unknown;

      if (!logoFile || !(logoFile instanceof File)) {
        return new Response("Expected a POST request with a logo file", {
          status: 400,
        });
      }

      const client = await createAPIClient(env, requestWrapper);
      const { data: authParams, error: authParamsErr } =
        await client.db.getAuthParams();

      const orgId = authParams?.organizationId;

      if (authParamsErr || !orgId) {
        return client.response.unauthorized();
      }

      const logoId = crypto.randomUUID();
      const logoUrl = `organization/${orgId}/logo/${logoId}`;

      const { error: uploadErr } = await client.db.uploadLogo(
        logoFile,
        logoUrl,
        orgId
      );

      if (uploadErr) {
        return client.response.newError(uploadErr, 500);
      }

      return client.response.successJSON({ ok: "true" }, true);
    }
  );

  router.get(
    "/v1/organizations/:id/logo",
    async (_, requestWrapper: RequestWrapper, env: Env) => {
      const client = await createAPIClient(env, requestWrapper);
      const { data: authParams, error: authParamsErr } =
        await client.db.getAuthParams();

      const orgId = authParams?.organizationId;

      if (authParamsErr || !orgId) {
        return client.response.unauthorized();
      }

      const { data: logoPath, error: logoPathErr } =
        await client.db.getLogoPath(orgId);

      if (logoPathErr || !logoPath) {
        return client.response.newError("Logo not found", 404);
      }

      const logoUrl = `${env.SUPABASE_URL}/storage/v1/object/public/organization_assets/${logoPath}`;
      return client.response.successJSON({ logoUrl: logoUrl }, true);
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

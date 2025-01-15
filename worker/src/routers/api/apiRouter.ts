import { Env } from "../..";
import { Database } from "../../../supabase/database.types";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { Job, isValidStatus, validateRun } from "../../lib/models/Runs";
import { HeliconeNode, validateHeliconeNode } from "../../lib/models/Tasks";
import { validateAlertCreate } from "../../lib/util/validators/alertValidators";

import { OpenAPIRouterType } from "@cloudflare/itty-router-openapi";
import { Route } from "itty-router";
import { logAsync } from "../../lib/managers/AsyncLogManager";
import { createAPIClient } from "../../api/lib/apiClient";

import {
  hideProperty,
  unhideProperty,
} from "../../lib/managers/PropertiesManager";

function getAPIRouterV1(
  router: OpenAPIRouterType<
    Route,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >
) {
  router.post(
    "/job",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, _ctx, requestWrapper);
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
      const client = await createAPIClient(env, _ctx, requestWrapper);
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
      const client = await createAPIClient(env, _ctx, requestWrapper);
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
      const client = await createAPIClient(env, _ctx, requestWrapper);
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
    "/googleapis/v1/log",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      return await logAsync(requestWrapper, env, ctx, "GOOGLE");
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
      _env: Env,
      _ctx: ExecutionContext
    ) => {
      interface Body {
        key: string;
        value: string;
      }

      const newProperty = await requestWrapper.getJson<Body>();

      const auth = await requestWrapper.auth();

      if (auth.error) {
        return new Response(auth.error, { status: 401 });
      }

      if (auth.data?._type !== "bearer") {
        return new Response("Invalid token type.", { status: 401 });
      }

      const result = await fetch(
        `https://api.helicone.ai/v1/request/${id}/property`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: auth.data.token,
          },
          body: JSON.stringify(newProperty),
        }
      );

      if (!result.ok) {
        return new Response(`error ${await result.text()}`, {
          status: 500,
        });
      }

      return new Response(
        JSON.stringify({
          ok: "true",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
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
      const client = await createAPIClient(env, _ctx, requestWrapper);
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
    async (
      { params: { id } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, _ctx, requestWrapper);
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
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
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

      const client = await createAPIClient(env, _ctx, requestWrapper);
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
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, _ctx, requestWrapper);
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

  router.post(
      "/v2/properties/hide",
      async (
          _,
          requestWrapper: RequestWrapper,
          env: Env,
          _ctx: ExecutionContext
      ) => {
        return await hideProperty(requestWrapper, env); // Ensure the updated hide logic is used.
      }
  );

  router.post(
      "/v2/properties/unhide",
      async (
          _,
          requestWrapper: RequestWrapper,
          env: Env,
          _ctx: ExecutionContext
      ) => {
        return await unhideProperty(requestWrapper, env); // Ensure the updated unhide logic is used.
      }
  );

}

export const getAPIRouter = (
  router: OpenAPIRouterType<
    Route,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >
) => {
  getAPIRouterV1(router);

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

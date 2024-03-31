import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
  urlencoded,
} from "express";
import morgan from "morgan";
import { PostHog } from "posthog-node";
import swaggerUi from "swagger-ui-express";

import { hashAuth } from "./lib/db/hash";
import { SupabaseConnector } from "./lib/db/supabase";
import { FineTuningManager } from "./lib/managers/FineTuningManager";
import { withAuth } from "./lib/routers/withAuth";
import { FilterNode } from "./lib/shared/filters/filterDefs";
import { getRequests, getRequestsCached } from "./lib/shared/request/request";
import { runLoopsOnce, runMainLoops } from "./mainLoops";
import { paths } from "./schema/types";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "./lib/tokens/tokenCounter";

const ph_project_api_key = process.env.PUBLIC_POSTHOG_API_KEY;

let postHogClient: PostHog | undefined = undefined;
if (ph_project_api_key) {
  postHogClient = new PostHog(ph_project_api_key, {
    host: "https://app.posthog.com",
  });
}

// This prevents the application from crashing when an unhandled error occurs
const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`Unhandled error: ${err}, stack: ${err.stack}`);
  res.status(500).send("Something broke!");
};

export const ENVIRONMENT = process.env.VERCEL_ENV ?? "development";

export const legacyRouter = express.Router();

legacyRouter.use(express.json({ limit: "50mb" }));
legacyRouter.use(express.urlencoded({ limit: "50mb" }));

// for logs

legacyRouter.use(errorHandler);
const allowedOriginsEnv = {
  production: [
    /^https?:\/\/(www\.)?helicone\.ai$/,
    /^https?:\/\/(www\.)?.*-helicone\.vercel\.app$/,
    /^https?:\/\/(www\.)?helicone\.vercel\.app$/,
    /^https?:\/\/(www\.)?helicone-git-valhalla-use-jawn-to-read-helicone\.vercel\.app$/,
  ],
  development: [/^http:\/\/localhost:3000$/, /^http:\/\/localhost:3001$/],
};

const corsForHelicone = (req: Request, res: Response, next: () => void) => {
  const origin = req.get("Origin");
  if (!origin) {
    next();
    return;
  }

  const allowedOrigins =
    ENVIRONMENT === "development"
      ? allowedOriginsEnv["development"]
      : allowedOriginsEnv["production"];
  const isAllowedOrigin = allowedOrigins.some((pattern) =>
    pattern.test(origin)
  );

  if (isAllowedOrigin) {
    // Set CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, helicone-authorization"
    );
  } else {
    res.header(
      "info",
      `not allowed origin (${origin}) for ${ENVIRONMENT} environment :(`
    );
  }
  next();
};

legacyRouter.use(corsForHelicone);
legacyRouter.options("*", (req, res) => {
  res.sendStatus(200);
});

legacyRouter.post(
  "/v1/key/generateHash",
  withAuth<
    paths["/v1/key/generateHash"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, authParams }) => {
    try {
      const body = await request.getRawBody<any>();
      const { apiKey, userId, keyName } = body;
      const hashedKey = await hashAuth(apiKey);

      const insertRes = await supabaseClient.client
        .from("helicone_api_keys")
        .insert({
          api_key_hash: hashedKey,
          user_id: userId,
          api_key_name: keyName,
          organization_id: authParams.organizationId,
        });

      if (insertRes.error) {
        res.status(500).json({
          error: {
            message: "Failed to insert key",
            details: insertRes.error,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
      });
      return;
    } catch (error: any) {
      console.log(`Failed to generate key hash: ${error}`);
      res.status(400).json({
        error: "Failed to generate key hash",
        message: error,
      });
      return;
    }
  })
);

legacyRouter.post(
  "/v1/request/query",
  withAuth<
    paths["/v1/request/query"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, authParams }) => {
    const body = await request.getRawBody<any>();

    const { filter, offset, limit, sort, isCached } = body;

    const metrics = isCached
      ? await getRequestsCached(
          authParams.organizationId,
          filter,
          offset,
          limit,
          sort
        )
      : await getRequests(
          authParams.organizationId,
          filter,
          offset,
          limit,
          sort
        );
    postHogClient?.capture({
      distinctId: `${await hashAuth(body)}-${authParams.organizationId}`,
      event: "fetch_requests",
      properties: {
        success: metrics.error === null,
        org_id: authParams.organizationId,
        request_body: body,
      },
    });
    res
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE")
      .header(
        "Access-Control-Allow-Headers",
        "Content-Type, helicone-authorization"
      )
      .status(metrics.error === null ? 200 : 500)
      .json(metrics);
  })
);

legacyRouter.get(
  "/v1/fine-tune/:jobId/stats",
  withAuth<paths["/v1/fine-tune/{jobId}/stats"]["get"]>(
    async ({ request, res, supabaseClient, authParams }) => {
      const { jobId } = request.getParams();

      const { data: fineTuneJob, error: fineTuneJobError } =
        await supabaseClient.client
          .from("finetune_job")
          .select("*")
          .eq("id", jobId ?? "")
          .eq("organization_id", authParams.organizationId)
          .single();

      if (!fineTuneJob || fineTuneJobError) {
        res
          .status(500)
          .header("Access-Control-Allow-Origin", "*")
          .header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE")
          .header(
            "Access-Control-Allow-Headers",
            "Content-Type, helicone-authorization"
          )
          .json({
            error: "No fine tune job found",
          });
        return;
      }

      const { data: key, error: keyError } = await supabaseClient.client
        .from("decrypted_provider_keys")
        .select("decrypted_provider_key")
        .eq("id", fineTuneJob.provider_key_id)
        .eq("org_id", authParams.organizationId)
        .single();

      if (keyError || !key || !key.decrypted_provider_key) {
        res
          .status(500)
          .header("Access-Control-Allow-Origin", "*")
          .header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE")
          .header(
            "Access-Control-Allow-Headers",
            "Content-Type, helicone-authorization"
          )
          .json({
            error: "No Provider Key found",
          });
        return;
      }

      const fineTuningManager = new FineTuningManager(
        key.decrypted_provider_key
      );

      const fineTuneJobData = await fineTuningManager.getFineTuneJob(
        fineTuneJob.finetune_job_id
      );

      if (fineTuneJobData.error || !fineTuneJobData.data) {
        res
          .status(500)
          .header("Access-Control-Allow-Origin", "*")
          .header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE")
          .header(
            "Access-Control-Allow-Headers",
            "Content-Type, helicone-authorization"
          )
          .json({
            error: fineTuneJobData.error,
          });
        return;
      }

      res
        .status(200)
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE")
        .header(
          "Access-Control-Allow-Headers",
          "Content-Type, helicone-authorization"
        )
        .json(fineTuneJobData.data);
    }
  )
);

async function hasAccessToFineTune(supabaseClient: SupabaseConnector) {
  const { data: org, error: orgError } = await supabaseClient.client
    .from("organization")
    .select("*")
    .eq("id", supabaseClient.organizationId ?? "")
    .single();
  if (orgError) {
    return false;
  }

  if (!org.tier) {
    return false;
  }
  if (org.tier === "free") {
    const jobCountQuery = await supabaseClient.client
      .from("finetune_job")
      .select("*", { count: "exact" })
      .eq("organization_id", supabaseClient.organizationId ?? "");
    console.log("jobCountQuery", jobCountQuery);
    const jobsCount = jobCountQuery.count ?? 1;
    console.log("jobsCount", jobsCount);
    if (jobsCount >= 1) {
      return false;
    } else {
      return true;
    }
  }
  return true;
}

legacyRouter.post(
  "/v1/dataset/:datasetId/fine-tune",
  withAuth<
    paths["/v1/dataset/{datasetId}/fine-tune"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, authParams }) => {
    if (!(await hasAccessToFineTune(supabaseClient))) {
      res.status(405).json({
        error: "Must be on pro or higher plan to use fine-tuning",
      });
      return;
    }

    const { providerKeyId } = await request.getBody();

    if (!providerKeyId) {
      res.status(500).json({
        error: "No provider key id provided",
      });
      return;
    }
    const { datasetId } = request.getParams();
    const { data: dataset, error: datasetError } = await supabaseClient.client
      .from("finetune_dataset")
      .select("*")
      .eq("id", datasetId)
      .single();
    let filterNode: FilterNode;
    try {
      filterNode = JSON.parse(dataset?.filter_node ?? "");
    } catch (e) {
      res.status(500).json({
        error: "No dataset found",
      });
      return;
    }
    if (datasetError || !dataset) {
      res.status(500).json({
        error: "No dataset found",
      });
      return;
    }

    const metrics = await getRequests(
      authParams.organizationId,
      filterNode,
      0,
      1000,
      {}
    );

    if (metrics.error || !metrics.data || metrics.data.length === 0) {
      res.status(500).json({
        error: "No requests found",
      });
      return;
    }

    const { data: key, error: keyError } = await supabaseClient.client
      .from("decrypted_provider_keys")
      .select("decrypted_provider_key")
      .eq("id", providerKeyId)
      .eq("org_id", authParams.organizationId)
      .single();

    if (keyError || !key || !key.decrypted_provider_key) {
      res.status(500).json({
        error: "No Provider Key found",
      });
      return;
    }

    const fineTuningManager = new FineTuningManager(key.decrypted_provider_key);
    try {
      const fineTuneJob = await fineTuningManager.createFineTuneJob(
        metrics.data,
        "model",
        "suffix"
      );

      if (fineTuneJob.error || !fineTuneJob.data) {
        res.status(500).json({
          error: fineTuneJob.error,
        });
        return;
      }

      const url = `https://platform.openai.com/finetune/${fineTuneJob.data.id}?filter=all`;
      Sentry.captureMessage(
        `fine-tune job created - ${fineTuneJob.data.id} - ${authParams.organizationId}`
      );

      postHogClient?.capture({
        distinctId: `${fineTuneJob.data.id}-${authParams.organizationId}`,
        event: "fine_tune_job",
        properties: {
          id: fineTuneJob.data.id,
          success: true,
          org_id: authParams.organizationId,
        },
      });

      const fineTunedJobId = await supabaseClient.client
        .from("finetune_job")
        .insert({
          dataset_id: dataset.id,
          finetune_job_id: fineTuneJob.data.id,
          provider_key_id: providerKeyId,
          status: "created",
          organization_id: authParams.organizationId,
        })
        .select("*")
        .single();

      res.json({
        success: true,
        data: {
          fineTuneJob: fineTunedJobId.data?.id,
          url: url,
        },
      });
    } catch (e) {
      Sentry.captureException(e);
      postHogClient?.capture({
        distinctId: `${authParams.organizationId}`,
        event: "fine_tune_job",
        properties: {
          success: false,
          org_id: authParams.organizationId,
        },
      });
      res.status(500).json({
        error:
          "Sorry the fine tuning job you requested failed. Right now it is in beta and only support gpt3.5 and gpt4 requests",
        message: e,
      });
      return;
    }
  })
);

legacyRouter.post(
  "/v1/fine-tune",
  withAuth<
    paths["/v1/fine-tune"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, authParams }) => {
    if (!(await hasAccessToFineTune(supabaseClient))) {
      res.status(405).json({
        error: "Must be on pro or higher plan to use fine-tuning",
      });
      return;
    }

    const body = await request.getRawBody<any>();

    const { filter, providerKeyId, uiFilter } = body;

    const metrics = await getRequests(
      authParams.organizationId,
      filter,
      0,
      1000,
      {}
    );

    if (metrics.error || !metrics.data || metrics.data.length === 0) {
      res.status(500).json({
        error: "No requests found",
      });
      return;
    }

    const { data: key, error: keyError } = await supabaseClient.client
      .from("decrypted_provider_keys")
      .select("decrypted_provider_key")
      .eq("id", providerKeyId)
      .eq("org_id", authParams.organizationId)
      .single();

    if (keyError || !key || !key.decrypted_provider_key) {
      res.status(500).json({
        error: "No Provider Key found",
      });
      return;
    }

    const fineTuningManager = new FineTuningManager(key.decrypted_provider_key);
    try {
      const fineTuneJob = await fineTuningManager.createFineTuneJob(
        metrics.data,
        "model",
        "suffix"
      );

      if (fineTuneJob.error || !fineTuneJob.data) {
        res.status(500).json({
          error: fineTuneJob.error,
        });
        return;
      }

      const url = `https://platform.openai.com/finetune/${fineTuneJob.data.id}?filter=all`;
      Sentry.captureMessage(
        `fine-tune job created - ${fineTuneJob.data.id} - ${authParams.organizationId}`
      );

      postHogClient?.capture({
        distinctId: `${fineTuneJob.data.id}-${authParams.organizationId}`,
        event: "fine_tune_job",
        properties: {
          id: fineTuneJob.data.id,
          success: true,
          org_id: authParams.organizationId,
        },
      });

      const dataset = await supabaseClient.client
        .from("finetune_dataset")
        .insert({
          name: `Automated Dataset for ${fineTuneJob.data.id}`,
          filters: JSON.stringify(uiFilter),
          organization_id: authParams.organizationId,
        })
        .select("*")
        .single();
      if (dataset.error || !dataset.data) {
        res.status(500).json({
          error: dataset.error,
        });
        return;
      }

      const fineTunedJobId = await supabaseClient.client
        .from("finetune_job")
        .insert({
          dataset_id: dataset.data.id,
          finetune_job_id: fineTuneJob.data.id,
          provider_key_id: providerKeyId,
          status: "created",
          organization_id: authParams.organizationId,
        })
        .select("*")
        .single();

      res.json({
        success: true,
        data: {
          fineTuneJob: fineTunedJobId.data?.id,
          url: url,
        },
      });
    } catch (e) {
      Sentry.captureException(e);
      postHogClient?.capture({
        distinctId: `${authParams.organizationId}`,
        event: "fine_tune_job",
        properties: {
          success: false,
          org_id: authParams.organizationId,
        },
      });
      res.status(500).json({
        error:
          "Sorry the fine tuning job you requested failed. Right now it is in beta and only support gpt3.5 and gpt4 requests",
        message: e,
      });
      return;
    }
  })
);
postHogClient?.shutdown(); // new

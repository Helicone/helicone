require("dotenv").config({
  path: "./.env",
});

import express from "express";
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import * as OpenApiValidator from "express-openapi-validator";
import morgan from "morgan";
import { v4 as uuid } from "uuid";
import { paths } from "./schema/types";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "./tokens/tokenCounter";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { withAuth } from "./lib/routers/withAuth";
import { getRequests, getRequestsCached } from "./lib/shared/request/request";
import { withDB } from "./lib/routers/withDB";
import { FineTuningManager } from "./lib/managers/FineTuningManager";

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
const dirname = __dirname;

const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(Sentry.Handlers.errorHandler());

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// for logs
app.use(morgan("combined"));
app.use(express.json()); // for parsing application/json

app.use(errorHandler);
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

app.use(corsForHelicone);
app.options("*", (req, res) => {
  res.sendStatus(200);
});

app.use(
  OpenApiValidator.middleware({
    apiSpec: process.env.OPENAPI_SCHEMA_FILE ?? `${dirname}/schema/openapi.yml`,
    validateRequests: true,
  })
);

app.post(
  "/v1/request/query",
  withAuth<
    paths["/v1/request/query"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, db, authParams }) => {
    const body = await request.getRawBody<any>();
    console.log("body", body);
    const { filter, offset, limit, sort, isCached } = body;

    const metrics = isCached
      ? await getRequestsCached(
          authParams.organizationId,
          filter,
          offset,
          limit,
          sort,
          supabaseClient.client
        )
      : await getRequests(
          authParams.organizationId,
          filter,
          offset,
          limit,
          sort,
          supabaseClient.client
        );
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

app.post(
  "/v1/request",
  withAuth<
    paths["/v1/request"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, db }) => {
    // Handle your logic here
    const heliconeRequest = await request.getBody();
    const heliconeRequestID = heliconeRequest.request_id;
    const insertRequestResult = await db.insertRequest({
      body: heliconeRequest.body,
      createdAt: new Date(),
      requestReceivedAt: new Date(heliconeRequest.requestReceivedAt),
      heliconeApiKeyID: null,
      heliconeOrgID: supabaseClient.organizationId ?? null,
      heliconeProxyKeyID: null,
      id: heliconeRequestID,
      properties: heliconeRequest.properties,
      provider: heliconeRequest.provider,
      urlHref: heliconeRequest.url_href,
      userId: heliconeRequest.user_id ?? null,
      model: heliconeRequest.model ?? null,
    });
    if (insertRequestResult.error) {
      res.status(500).json({
        error: insertRequestResult.error,
        trace: "insertRequestResult.error",
      });
      return;
    }

    res.json({
      message: "Request received! :)",
      orgId: supabaseClient.organizationId,
      requestId: heliconeRequestID,
    });
  })
);
app.put(
  "/v1/feedback",
  withAuth<
    paths["/v1/feedback"]["put"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, db }) => {
    // Handle your logic here
    const heliconeFeedback = await request.getBody();

    const insertFeedbackResult = await db.upsertFeedback({
      createdAt: new Date(),
      rating: heliconeFeedback.rating,
      responseID: heliconeFeedback.response_id,
    });

    if (insertFeedbackResult.error) {
      res.status(500).json({
        error: insertFeedbackResult.error,
        trace: "insertFeedbackResult.error",
      });
      return;
    }
    res.json({
      message: "Feedback received! :)",
    });
  })
);

app.post(
  "/v1/fine-tune",
  withAuth<
    paths["/v1/fine-tune"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, db, authParams }) => {
    res.status(404).json({
      error: "No implemented yet",
    });
    return;
  //   const { data: org, error: orgError } = await supabaseClient.client
  //     .from("organization")
  //     .select("*")
  //     .eq("id", authParams.organizationId ?? "")
  //     .single();
  //   if (orgError) {
  //     res.status(500).json({
  //       error: "Must be on pro or higher plan to use fine-tuning",
  //     });
  //     return;
  //   }
  //   if (!org.tier || org.tier === "free") {
  //     res.status(405).json({
  //       error: "Must be on pro or higher plan to use fine-tuning",
  //     });
  //     return;
  //   }
  //   const body = await request.getRawBody<any>();
  //   console.log("body", body);
  //   const { filter, providerKeyId } = body;

  //   const metrics = await getRequests(
  //     authParams.organizationId,
  //     filter,
  //     0,
  //     1000,
  //     {},
  //     supabaseClient.client
  //   );

  //   if (metrics.error || !metrics.data || metrics.data.length === 0) {
  //     res.status(500).json({
  //       error: "No requests found",
  //     });
  //     return;
  //   }

  //   const { data: key, error: keyError } = await supabaseClient.client
  //     .from("decrypted_provider_keys")
  //     .select("decrypted_provider_key")
  //     .eq("id", providerKeyId)
  //     .eq("org_id", authParams.organizationId)
  //     .single();

  //   if (keyError || !key || !key.decrypted_provider_key) {
  //     res.status(500).json({
  //       error: "No Provider Key found",
  //     });
  //     return;
  //   }

  //   const fineTuningManager = new FineTuningManager(key.decrypted_provider_key);
  //   try {
  //     const fineTuneJob = await fineTuningManager.createFineTuneJob(
  //       metrics.data,
  //       "model",
  //       "suffix"
  //     );

  //     if (fineTuneJob.error || !fineTuneJob.data) {
  //       res.status(500).json({
  //         error: fineTuneJob.error,
  //       });
  //       return;
  //     }

  //     const url = `https://platform.openai.com/finetune/${fineTuneJob.data.id}?filter=all`;
  //     Sentry.captureMessage(
  //       `fine-tune job created - ${fineTuneJob.data.id} - ${authParams.organizationId}`
  //     );
  //     res.json({
  //       success: true,
  //       data: {
  //         url: url,
  //       },
  //     });
  //   } catch (e) {
  //     Sentry.captureException(e);
  //     res.status(500).json({
  //       error:
  //         "Sorry the fine tuning job you requested failed. Right now it is in beta and only support gpt3.5 and gpt4 requests",
  //       message: e,
  //     });
  //     return;
  //   }
  // })
);

app.post("/v1/tokens/anthropic", async (req, res) => {
  const body = req.body;
  const content = body?.content;
  const tokens = await getTokenCountAnthropic(content ?? "");
  res.json({ tokens });
});

app.post("/v1/tokens/gpt3", async (req, res) => {
  const body = req.body;
  const content = body?.content;
  const tokens = await getTokenCountGPT3(content ?? "");
  res.json({ tokens });
});

app.post(
  "/v1/response",
  withAuth<
    paths["/v1/response"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, db }) => {
    // Handle your logic here
    const heliconeResponse = await request.getBody();

    const responseId = heliconeResponse.response_id ?? uuid();

    const insertResponseResult = await db.insertResponse({
      body: heliconeResponse.body,
      createdAt: new Date(),
      responseReceivedAt: new Date(heliconeResponse.responseReceivedAt),
      delayMs: heliconeResponse.delay_ms ?? 0,
      http_status: heliconeResponse.http_status ?? null,
      id: responseId,
      model: heliconeResponse.model ?? null,
      promptTokens: heliconeResponse.prompt_tokens ?? null,
      completionTokens: heliconeResponse.completion_tokens ?? null,
      request: heliconeResponse.heliconeRequestId,
      heliconeOrgID: supabaseClient.organizationId,
    });
    if (insertResponseResult.error) {
      res.status(500).json({
        error: insertResponseResult.error,
        trace: "insertResponseResult.error",
      });
      return;
    }
    res.json({
      message: "Response received! :)",
      orgId: supabaseClient.organizationId,
      responseId,
    });
  })
);

app.patch(
  "/v1/response",
  withAuth<
    paths["/v1/response"]["patch"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, db }) => {
    // Handle your logic here
    const heliconeResponse = await request.getBody();

    const responseId = heliconeResponse.response_id ?? uuid();

    const insertResponseResult = await db.updateResponse({
      body: heliconeResponse.body,
      createdAt: new Date(),
      responseReceivedAt: new Date(heliconeResponse.responseReceivedAt),
      delayMs: heliconeResponse.delay_ms ?? 0,
      http_status: heliconeResponse.http_status ?? null,
      id: responseId,
      model: heliconeResponse.model ?? null,
      promptTokens: heliconeResponse.prompt_tokens ?? null,
      completionTokens: heliconeResponse.completion_tokens ?? null,
      request: heliconeResponse.heliconeRequestId,
    });
    if (insertResponseResult.error) {
      res.status(500).json({
        error: insertResponseResult.error,
        trace: "patch.insertResponseResult.error",
      });
      return;
    }
    res.json({
      message: "Response received! :)",
      orgId: supabaseClient.organizationId,
      responseId,
    });
  })
);

app.get(
  "/healthcheck",
  withDB(async ({ db, request, res }) => {
    const now = await db.now();
    if (now.error) {
      res.json({ status: "unhealthy :(", error: now.error });
      return;
    }
    res.json({
      status: "healthy :)",
      dataBase: now.data?.rows,
      version: "jawn prod - pools",
    });
  })
);

app.get(
  "/healthcheck-auth",
  withAuth(async ({ db, request, res, supabaseClient }) => {
    const now = await db.now();
    if (now.error) {
      res.json({ status: "unhealthy :(", error: now.error });
      return;
    }
    res.json({
      status: "healthy :)",
      dataBase: now.data?.rows,
      orgId: supabaseClient.organizationId,
    });
  })
);

const server = app.listen(
  parseInt(process.env.PORT ?? "8585"),
  "0.0.0.0",
  () => {
    console.log(`Server is running on http://localhost:8585`);
  }
);

server.on("error", console.error);

// This
server.setTimeout(1000 * 60 * 10); // 10 minutes

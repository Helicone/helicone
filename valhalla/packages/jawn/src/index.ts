// src/index.ts
import express from "express";
import * as OpenApiValidator from "express-openapi-validator";
import { withAuth, withDB } from "helicone-shared-ts";
import morgan from "morgan";
import { v4 as uuid } from "uuid";
import { paths } from "./schema/types";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "./tokens/tokenCounter";

const dirname = __dirname;

require("dotenv").config({
  path: "./.env",
});

const app = express();

export const helloWorld = () => {
  return "Hello, world!";
};

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// for logs
app.use(morgan("combined"));
app.use(express.json()); // for parsing application/json

app.use(
  OpenApiValidator.middleware({
    apiSpec: process.env.OPENAPI_SCHEMA_FILE ?? `${dirname}/schema/openapi.yml`,
    validateRequests: true,
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

app.get(
  "/healthcheck-db",
  withDB(async ({ db, request, res }) => {
    const now = await db.now();
    if (now.error) {
      res.json({ status: "unhealthy :(", error: now.error });
      return;
    }
    res.json({ status: "healthy :)", dataBase: now.data?.rows });
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

app.get("/healthcheck", (request, res) => {
  res.json({
    status: "healthy :)",
  });
});

app.listen(8585, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:8585`);
});

console.log("Hello, world!");

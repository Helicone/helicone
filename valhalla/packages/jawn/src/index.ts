// src/index.ts
import express from "express";
import * as OpenApiValidator from "express-openapi-validator";
import { withAuth, withDB } from "helicone-shared-ts";
import morgan from "morgan";
import { v4 as uuid } from "uuid";
import { paths } from "./schema/types";

const dirname = __dirname;
console.log({ dirname });

require("dotenv").config({
  path: "./.env",
});

const app = express();

export const helloWorld = () => {
  return "Hello, world!";
};

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
    const heliconeRequestID = heliconeRequest.request_id ?? uuid();
    const insertRequestResult = await db.insertRequest({
      body: heliconeRequest.body,
      createdAt: new Date(),
      heliconeApiKeyID: null,
      heliconeOrgID: supabaseClient.organizationId ?? null,
      heliconeProxyKeyID: null,
      id: heliconeRequestID,
      properties: heliconeRequest.properties,
      provider: heliconeRequest.provider,
      urlHref: heliconeRequest.url_href,
      userId: heliconeRequest.user_id ?? null,
    });
    if (insertRequestResult.error) {
      console.log("insertRequestResult.error", insertRequestResult.error);
      res.status(500).json({
        error: insertRequestResult.error,
        trace: "insertRequestResult.error",
      });
      return;
    }
    console.log("insertRequestResult", insertRequestResult);

    res.json({
      message: "Request received! :)",
      orgId: supabaseClient.organizationId,
      requestId: heliconeRequestID,
    });
  })
);

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
      completionTokens: heliconeResponse.completion_tokens ?? null,
      createdAt: new Date(),
      delayMs: heliconeResponse.delay_ms ?? 0,
      http_status: heliconeResponse.http_status ?? null,
      id: responseId,
      model: heliconeResponse.model ?? null,
      promptTokens: heliconeResponse.prompt_tokens ?? null,
      request: heliconeResponse.heliconeRequestId,
    });
    if (insertResponseResult.error) {
      res.status(500).json({
        error: insertResponseResult.error,
        trace: "insertResponseResult.error",
      });
      return;
    }
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

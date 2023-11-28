// src/index.ts
import express, { Request, Response } from "express";
import morgan from "morgan";
import { createValhallaClient, withDB, withAuth } from "helicone-shared-ts";
import * as OpenApiValidator from "express-openapi-validator";
import { components, paths } from "./schema/types";
import { v4 as uuid } from "uuid";

const dirname = __dirname;
console.log({ dirname });

require("dotenv").config({
  path: "./.env",
});

const app = express();

// for logs
app.use(morgan("combined"));
app.use(express.json()); // for parsing application/json

app.use(
  OpenApiValidator.middleware({
    apiSpec: `${dirname}/schema/openapi.yml`,
    validateRequests: true,
  })
);

app.post(
  "/v1/request",
  withAuth<
    paths["/v1/request"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, db }) => {
    // Handle your logic here
    const { request: heliconeRequest, response: heliconeResponse } =
      await request.getBody();
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
      res.status(500).json({
        error: insertRequestResult.error,
      });
      return;
    }

    const insertResponseResult = await db.insertResponse({
      body: heliconeResponse.body,
      completionTokens: heliconeResponse.completion_tokens ?? null,
      createdAt: new Date(),
      delayMs: heliconeResponse.delay_ms ?? 0,
      http_status: heliconeResponse.http_status ?? null,
      id: heliconeResponse.response_id ?? uuid(),
      model: heliconeResponse.model ?? null,
      promptTokens: heliconeResponse.prompt_tokens ?? null,
      request: heliconeRequestID,
    });
    if (insertResponseResult.error) {
      res.status(500).json({
        error: insertResponseResult.error,
      });
      return;
    }
    res.json({
      message: "Request received! :)",
      orgId: supabaseClient.organizationId,
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

app.get("/healthcheck", (request, res) => {
  res.json({
    status: "healthy :)",
  });
});

app.listen(8585, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:8585`);
});

console.log("Hello, world!");

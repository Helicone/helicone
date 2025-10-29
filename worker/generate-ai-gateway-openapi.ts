import fs from "fs";
import path from "path";
import { createDocument } from "zod-openapi";

import { CreateChatCompletionRequest } from "./src/lib/ai-gateway/validators/chat-completion-types";
import { CreateResponse } from "./src/lib/ai-gateway/validators/responses-types";

async function main() {
  const document = createDocument({
    openapi: "3.0.0",
    info: {
      title: "Helicone AI Gateway API",
      version: "1.0.0",
      description: "OpenAPI spec derived from Zod schemas for AI Gateway.",
    },
    servers: [{ url: "https://ai-gateway.helicone.ai" }],
    paths: {
      "/v1/chat/completions": {
        post: {
          summary: "Create Chat Completion",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: CreateChatCompletionRequest },
            },
          },
          responses: {
            "200": { description: "Request accepted" },
          },
        },
      },
      "/v1/responses": {
        post: {
          summary: "Create Response",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: CreateResponse },
            },
          },
          responses: {
            "200": { description: "Request accepted" },
          },
        },
      },
    },
  });

  const outPath = path.join(__dirname, "..", "docs", "ai-gateway.openapi.json");
  fs.writeFileSync(outPath, JSON.stringify(document, null, 2));
  console.log(`Generated OpenAPI spec at: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


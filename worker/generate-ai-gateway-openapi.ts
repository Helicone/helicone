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
      "/v1/models": {
        get: {
          summary: "Get Models",
          description: "Returns all available models supported by Helicone AI Gateway (OpenAI-compatible endpoint)",
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      object: {
                        type: "string",
                        enum: ["list"],
                      },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: {
                              type: "string",
                              description: "Model identifier",
                            },
                            object: {
                              type: "string",
                              enum: ["model"],
                            },
                            created: {
                              type: "integer",
                              description: "Unix timestamp of model creation",
                            },
                            owned_by: {
                              type: "string",
                              description: "Organization that owns the model",
                            },
                          },
                          required: ["id", "object", "created", "owned_by"],
                        },
                      },
                    },
                    required: ["object", "data"],
                  },
                },
              },
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                          type: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
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


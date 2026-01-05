import { z } from "zod";
import { CreateChatCompletionRequest } from "./chat-completion-types";
import { CreateResponse } from "./responses-types";
import { err, ok, Result } from "../../util/results";

const PtBChatCompletionSchema = CreateChatCompletionRequest.and(
  z.object({ model: z.string().min(1) })
);

const PtBCreateResponseSchema = CreateResponse.and(
  z.object({ model: z.string().min(1) })
);

const CHAT_COMPLETIONS_DOCS_URL =
  "https://docs.helicone.ai/rest/ai-gateway/post-v1-chat-completions";
const RESPONSES_API_DOCS_URL =
  "https://docs.helicone.ai/rest/ai-gateway/post-v1-responses";

function validatePayload(
  schema: z.ZodSchema<any>,
  body: unknown,
  docsUrl: string
): Result<void, string> {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];

    const errorDetail = firstIssue
      ? `${firstIssue.path.join(".") || "request"}: ${firstIssue.message}`
      : "Invalid request payload";

    const message = `${errorDetail}. See API reference: ${docsUrl}`;

    return err(message);
  }

  return ok(undefined);
}

export function validateOpenAIChatPayload(body: unknown): Result<void, string> {
  return validatePayload(PtBChatCompletionSchema, body, CHAT_COMPLETIONS_DOCS_URL);
}

export function validateOpenAIResponsePayload(body: unknown): Result<void, string> {
  return validatePayload(PtBCreateResponseSchema, body, RESPONSES_API_DOCS_URL);
}
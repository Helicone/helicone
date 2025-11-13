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

function validatePayload(schema: z.ZodSchema<any>, body: unknown): Result<void, string> {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];

    const message = firstIssue
      ? `${firstIssue.path.join(".") || "request"}: ${firstIssue.message}`
      : "Invalid request payload";

    return err(message);
  }

  return ok(undefined);
}

export function validateOpenAIChatPayload(body: unknown): Result<void, string> {
  return validatePayload(PtBChatCompletionSchema, body);
}

export function validateOpenAIResponsePayload(body: unknown): Result<void, string> {
  return validatePayload(PtBCreateResponseSchema, body);
}
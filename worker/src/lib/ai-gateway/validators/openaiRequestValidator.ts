import { z } from "zod";
import { CreateChatCompletionRequest } from "./chat-completion-types";
import { err, ok, Result } from "../../util/results";

const PtBChatCompletionSchema = CreateChatCompletionRequest.and(
  z.object({ model: z.string().min(1) })
);

export function normalizeReasoningConfig(body: any): any {
  if (!body.reasoning) {
    return body;
  }

  const normalized = { ...body };
  const reasoning = body.reasoning;

  if (reasoning.effort && !normalized.reasoning_effort) {
    normalized.reasoning_effort = reasoning.effort;
  }

  if (reasoning.enabled && !normalized.reasoning_effort) {
    normalized.reasoning_effort = "low";
  }

  delete normalized.reasoning;

  return normalized;
}

export function validateOpenAIChatPayload(body: unknown): Result<void, string> {
  const normalizedBody = normalizeReasoningConfig(body);

  const parsed = PtBChatCompletionSchema.safeParse(normalizedBody);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];

    const message = firstIssue
      ? `${firstIssue.path.join(".") || "request"}: ${firstIssue.message}`
      : "Invalid request payload";

    return err(message);
  }

  return ok(undefined);
}

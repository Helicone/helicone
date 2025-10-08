import { z } from "zod";
import { CreateChatCompletionRequest } from "./chat-completion-types";
import { err, ok, Result } from "../../util/results";

const PtBChatCompletionSchema = CreateChatCompletionRequest.and(
  z.object({ model: z.string().min(1) })
);

export function validateOpenAIChatPayload(body: unknown): Result<void, string> {
  const parsed = PtBChatCompletionSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];

    const message = firstIssue
      ? `${firstIssue.path.join(".") || "request"}: ${firstIssue.message}`
      : "Invalid request payload";

    return err(message);
  }

  return ok(undefined);
}

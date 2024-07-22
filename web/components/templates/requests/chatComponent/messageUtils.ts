import { LlmSchema } from "../../../../lib/api/models/requestResponseModel";
import { Message } from "./types";

// Helper functions
export function getRequestMessages(
  llmSchema: LlmSchema | undefined,
  requestBody: any
): Message[] {
  let messages = llmSchema?.request.messages ?? requestBody?.messages ?? [];
  if (
    requestBody?.system &&
    !messages.some(
      (msg: any) =>
        msg?.role === "system" && msg?.content === requestBody?.system
    )
  ) {
    messages = [
      {
        id: crypto.randomUUID(),
        role: "system",
        content: requestBody?.system,
      },
      ...messages,
    ];
  }
  return messages;
}

export function getResponseMessage(
  llmSchema: LlmSchema | undefined,
  responseBody: any,
  model: string
): Message | null {
  if (/^claude/.test(model)) {
    return {
      content: responseBody?.content?.[0]?.text ?? "",
      id: "123",
      role: "assistant",
    };
  }
  return (
    llmSchema?.response?.message ?? responseBody?.choices?.[0]?.message ?? null
  );
}

export function getMessages(
  requestMessages: Message[],
  responseMessage: Message | null,
  status: number
): Message[] {
  let messages = requestMessages || [];
  if (status === 200 && responseMessage) {
    messages = messages.concat([responseMessage]);
  }
  return messages;
}

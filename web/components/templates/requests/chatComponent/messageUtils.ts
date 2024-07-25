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
    // Handle Anthropic (Claude) response
    if (Array.isArray(responseBody?.content)) {
      return {
        id: responseBody.id || crypto.randomUUID(),
        role: "assistant",
        content: responseBody.content,
        model: responseBody.model,
      };
    } else {
      // Fallback for unexpected structure
      return {
        id: responseBody.id || crypto.randomUUID(),
        role: "assistant",
        content: responseBody?.content?.[0]?.text ?? "",
        model: responseBody.model,
      };
    }
  } else {
    // Handle OpenAI response
    const openAIMessage =
      llmSchema?.response?.message ??
      responseBody?.choices?.[0]?.message ??
      null;
    if (openAIMessage) {
      return {
        ...openAIMessage,
        id: openAIMessage.id || crypto.randomUUID(),
        model: model,
      };
    }
  }
  return null;
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

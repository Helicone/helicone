import { ChatCompletionChunk } from "@/llm-mapper/transform/types/openai";
import { OpenAILog, AnthropicLog } from "../../../types/logs";
import { toOpenAI } from "../response/toOpenai";
import { AnthropicToOpenAIStreamConverter } from "../streamedResponse/toOpenai";


export function isValidAnthropicLog(log: any): boolean {
  return (
    log.id &&
    log.type === "message" &&
    log.role === "assistant" &&
    log.content &&
    log.model &&
    log.stop_reason &&
    log.usage
  );
}

// Anthropic response logged in Helicone -> OpenAI Helicone log
export function toOpenAILog(anthropicLog: AnthropicLog): OpenAILog {
  const { streamed_data, ...anthropicResponseBody} = anthropicLog;
  const openAIResponseBody = toOpenAI(anthropicResponseBody);

  if (streamed_data) {
    const converter = new AnthropicToOpenAIStreamConverter();
    const openAIStreamEvents: ChatCompletionChunk[] = [];
    converter.processLines(streamed_data, (chunk) => {
      openAIStreamEvents.push(chunk);
    });
    return {
      ...openAIResponseBody,
      streamed_data: openAIStreamEvents,
    };
  }

  return openAIResponseBody;
}
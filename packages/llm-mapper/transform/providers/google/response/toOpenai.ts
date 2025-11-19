import {
  OpenAIChoice,
  OpenAIResponseBody,
  OpenAIToolCall,
  OpenAIUsage,
} from "../../../types/openai";
import {
  GoogleCandidate,
  GoogleContentPart,
  GoogleResponseBody,
  GoogleUsageMetadata,
} from "../../../types/google";

// Google Response Body -> OpenAI Response Body
export function toOpenAI(
  response: GoogleResponseBody
): OpenAIResponseBody {
  const created = Math.floor(Date.now() / 1000);
  const model = response.modelVersion ?? "google/gemini";
  const choices = mapCandidates(response.candidates ?? []);

  const usage = mapGoogleUsage(response.usageMetadata);

  return {
    id: response.responseId ?? response.name ?? `chatcmpl-gemini-${created}`,
    object: "chat.completion",
    created,
    model,
    choices,
    usage,
    system_fingerprint: model,
  };
}

function mapCandidates(candidates: GoogleCandidate[]): OpenAIChoice[] {
  if (candidates.length === 0) {
    return [
      {
        index: 0,
        message: {
          role: "assistant",
          content: null,
        },
        finish_reason: "stop",
        logprobs: null,
      },
    ];
  }

  return candidates.map((candidate, index) => {
    const { content, tool_calls } = extractContent(candidate.content);
    return {
      index: candidate.index ?? index,
      message: {
        role: "assistant",
        content: content.length > 0 ? content.join("") : null,
        ...(tool_calls.length > 0 && { tool_calls }),
      },
      finish_reason: mapGoogleFinishReason(candidate.finishReason),
      logprobs: null,
    };
  });
}

function extractContent(
  content: GoogleCandidate["content"]
): { content: string[]; tool_calls: OpenAIToolCall[] } {
  const contents = Array.isArray(content)
    ? content
    : content
      ? [content]
      : [];
  const textParts: string[] = [];
  const toolCalls: OpenAIToolCall[] = [];

  for (const block of contents) {
    const parts = Array.isArray(block?.parts)
      ? block?.parts
      : block?.parts
        ? [block.parts]
        : [];

    for (const part of parts) {
      if (!part) {
        continue;
      }

      if (part.text) {
        textParts.push(part.text);
      } else if (part.functionCall) {
        toolCalls.push(mapToolCall(part.functionCall, toolCalls.length));
      }
    }
  }

  return { content: textParts, tool_calls: toolCalls };
}

function mapToolCall(
  call: GoogleContentPart["functionCall"],
  index: number
): OpenAIToolCall {
  return {
    id: `call_${index}`,
    type: "function",
    function: {
      name: call?.name ?? `function_${index}`,
      arguments: JSON.stringify(call?.args ?? {}),
    },
  };
}

export function mapGoogleUsage(usage?: GoogleUsageMetadata): OpenAIUsage {
  const prompt =
    usage?.promptTokenCount ?? usage?.promptTokens ?? usage?.totalTokenCount ?? 0;
  const completion =
    usage?.candidatesTokenCount ??
    usage?.candidatesTokens ??
    Math.max(usage?.totalTokenCount ?? 0 - prompt, 0);
  const total = usage?.totalTokenCount ?? prompt + completion;

  return {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: total,
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0,
    },
  };
}

export function mapGoogleFinishReason(
  reason?: string
): OpenAIChoice["finish_reason"] {
  switch (reason) {
    case "STOP":
      return "stop";
    case "MAX_TOKENS":
      return "length";
    case "SAFETY":
    case "RECITATION":
      return "content_filter";
    case "FUNCTION_CALL":
      return "tool_calls";
    default:
      return "stop";
  }
}

import {
  OpenAIChoice,
  OpenAIFinishReason,
  OpenAIResponseBody,
  OpenAIResponseMessage,
  OpenAIToolCall,
  OpenAIUsage,
} from "../../../types/openai";
import {
  GoogleCandidate,
  GoogleContent,
  GoogleFunctionCall,
  GoogleResponseBody,
  GoogleTokenDetail,
  GoogleUsageMetadata,
} from "../../../types/google";

// Google Response Body -> OpenAI Response Body
export function toOpenAI(
  response: GoogleResponseBody
): OpenAIResponseBody {
  const created = Math.floor(Date.now() / 1000);
  const model = response.modelVersion ?? "google/gemini";
  const choices = mapCandidates(response.candidates ?? []);

  return {
    id: response.responseId ?? response.name ?? `chatcmpl-gemini-${created}`,
    object: "chat.completion",
    created,
    model,
    choices,
    usage: response.usageMetadata ? mapGoogleUsage(response.usageMetadata) : {} as OpenAIUsage,
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
        } as OpenAIResponseMessage,
        finish_reason: "stop",
        logprobs: null,
      },
    ];
  }

  return candidates.map((candidate, index) => {
    let content: string[] = [];
    let tool_calls: OpenAIToolCall[] = [];
    if (candidate.content) {
      const { content: extracted_content, tool_calls: extracted_tool_calls } = extractContent(candidate.content);
      content = extracted_content;
      tool_calls = extracted_tool_calls;
    }
    return {
      index: candidate.index ?? index,
      message: {
        role: "assistant",
        content: content.length > 0 ? content.join("") : null,
        ...(tool_calls.length > 0 && { tool_calls }),
      } as OpenAIResponseMessage,
      finish_reason: mapGoogleFinishReason(candidate.finishReason),
      logprobs: null,
    };
  });
}

function extractContent(
  content: GoogleContent | GoogleContent[]
): { content: string[]; tool_calls: OpenAIToolCall[] } {
  const contents = Array.isArray(content) ? content : [content];
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
  call: GoogleFunctionCall,
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

export function mapGoogleUsage(usage: GoogleUsageMetadata): OpenAIUsage {
  const aggregateModalityTokens = (
    ...details: Array<GoogleTokenDetail[] | undefined>
  ): Partial<Record<GoogleTokenDetail["modality"], number>> => {
    const totals: Partial<Record<GoogleTokenDetail["modality"], number>> = {};

    for (const detailList of details) {
      for (const detail of detailList ?? []) {
        if (!detail) {
          continue;
        }
        const modality = detail.modality;
        const tokenCount = detail.tokenCount ?? 0;
        totals[modality] = (totals[modality] ?? 0) + tokenCount;
      }
    }

    return totals;
  };

  const sumTokens = (details?: GoogleTokenDetail[]): number =>
    details?.reduce((total, detail) => total + (detail?.tokenCount ?? 0), 0) ??
    0;

  const sumTokensByModality = (
    details: GoogleTokenDetail[] | undefined,
    modality: GoogleTokenDetail["modality"]
  ): number =>
    details?.reduce(
      (total, detail) =>
        total + (detail?.modality === modality ? detail.tokenCount ?? 0 : 0),
      0
    ) ?? 0;

  const toolUsePromptTokens = usage.toolUsePromptTokenCount ?? 0;
  const reasoningTokens = usage.thoughtsTokenCount ?? 0;
  const prompt = (usage.promptTokenCount ?? 0) + toolUsePromptTokens;
  const completion =
    (usage.candidatesTokenCount || 0) + reasoningTokens;

  const total = usage.totalTokenCount

  const promptAudioTokens =
    sumTokensByModality(usage.promptTokenDetails, "AUDIO") +
    sumTokensByModality(usage.toolUsePromptTokensDetails, "AUDIO") +
    sumTokensByModality(usage.cacheTokenDetails, "AUDIO");

  const completionModalityTotals = aggregateModalityTokens(
    usage.candidatesTokensDetails
  );

  const completionAudioTokens =
    completionModalityTotals.AUDIO ??
    sumTokensByModality(usage.candidatesTokensDetails, "AUDIO");

  const cachedTokens =
    usage.cachedContentTokenCount ?? sumTokens(usage.cacheTokenDetails);

  return {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: total,
    completion_tokens_details: {
      reasoning_tokens: reasoningTokens,
      audio_tokens: completionAudioTokens,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0,
    },
    prompt_tokens_details: {
      audio_tokens: promptAudioTokens,
      cached_tokens: cachedTokens,
      cache_write_tokens: 0,
      cache_write_details: {
        write_5m_tokens: 0,
        write_1h_tokens: 0,
      },
    },
  };
}

export function mapGoogleFinishReason(
  reason?: string
): OpenAIFinishReason {
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

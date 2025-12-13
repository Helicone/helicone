import {
  OpenAIChoice,
  OpenAIFinishReason,
  OpenAIResponseBody,
  OpenAIResponseMessage,
  OpenAIToolCall,
  OpenAIUsage,
  OpenAIReasoningDetail,
} from "../../../types/openai";
import {
  GoogleCandidate,
  GoogleContent,
  GoogleContentPart,
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
    let reasoning: string | undefined;
    let reasoning_details: OpenAIReasoningDetail[] | undefined;

    if (candidate.content) {
      const extracted = extractContent(candidate.content);
      content = extracted.content;
      tool_calls = extracted.tool_calls;
      reasoning = extracted.reasoning;
      reasoning_details = extracted.reasoning_details;
    }

    return {
      index: candidate.index ?? index,
      message: {
        role: "assistant",
        content: content.length > 0 ? content.join("") : null,
        ...(reasoning && { reasoning }),
        ...(reasoning_details && reasoning_details.length > 0 && { reasoning_details }),
        ...(tool_calls.length > 0 && { tool_calls }),
      } as OpenAIResponseMessage,
      finish_reason: mapGoogleFinishReason(candidate.finishReason),
      logprobs: null,
    };
  });
}

/**
 * Represents extracted content from Google's response.
 */
interface ExtractedContent {
  content: string[];
  tool_calls: OpenAIToolCall[];
  reasoning?: string;
  reasoning_details?: OpenAIReasoningDetail[];
}

/**
 * Extracts content, tool calls, and thinking/reasoning from Google's response parts.
 *
 * Google's thinking model responses contain parts with a `thought` boolean flag:
 * - Parts with `thought: true` contain thinking/reasoning summaries
 * - Parts with `thought: false` or no `thought` field contain the final answer
 * - `thoughtSignature` may appear on ANY part (typically on content parts, not thought parts)
 *   and must be preserved for multi-turn conversations
 */
function extractContent(
  content: GoogleContent | GoogleContent[]
): ExtractedContent {
  const contents = Array.isArray(content) ? content : [content];
  const textParts: string[] = [];
  const thinkingTexts: string[] = [];
  const toolCalls: OpenAIToolCall[] = [];
  let collectedSignature: string | undefined;

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

      // Collect thoughtSignature from ANY part (Google puts it on content parts, not thought parts)
      if (part.thoughtSignature) {
        collectedSignature = part.thoughtSignature;
      }

      if (part.functionCall) {
        toolCalls.push(mapToolCall(part.functionCall, toolCalls.length));
      } else if (part.text) {
        // Check if this is a thinking part (Google uses thought: true)
        if (part.thought === true) {
          thinkingTexts.push(part.text);
        } else {
          textParts.push(part.text);
        }
      }
    }
  }

  const result: ExtractedContent = {
    content: textParts,
    tool_calls: toolCalls,
  };

  // Add reasoning if thinking parts were found
  if (thinkingTexts.length > 0) {
    result.reasoning = thinkingTexts.join("");
    // Preserve thoughtSignature in reasoning_details for multi-turn conversations
    // Google provides a single signature for all thinking content combined
    // Apply the same signature to ALL reasoning_details entries
    result.reasoning_details = thinkingTexts.map((thinking) => ({
      thinking,
      signature: collectedSignature || "",
    }));
  }

  return result;
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

  const total = usage.totalTokenCount;

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

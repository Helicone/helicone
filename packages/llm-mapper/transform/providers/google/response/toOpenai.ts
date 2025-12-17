import {
  OpenAIChoice,
  OpenAIFinishReason,
  OpenAIResponseBody,
  OpenAIResponseMessage,
  OpenAIToolCall,
  OpenAIUsage,
  OpenAIReasoningDetail,
  ChatCompletionContentPartImage,
} from "../../../types/openai";
import {
  GoogleCandidate,
  GoogleContent,
  GoogleFunctionCall,
  GoogleResponseBody,
  GoogleUsageMetadata,
} from "../../../types/google";
import { mapGoogleUsageToModelUsage } from "../utils/mapGoogleUsageToModelUsage";
import { mapModelUsageToOpenAI } from "@helicone-package/cost/usage/mapModelUsageToOpenAI";

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
    let images: ChatCompletionContentPartImage[] | undefined;

    if (candidate.content) {
      const extracted = extractContent(candidate.content);
      content = extracted.content;
      tool_calls = extracted.tool_calls;
      reasoning = extracted.reasoning;
      reasoning_details = extracted.reasoning_details;
      images = extracted.images;
    }

    return {
      index: candidate.index ?? index,
      message: {
        role: "assistant",
        content: content.length > 0 ? content.join("") : null,
        ...(reasoning && { reasoning }),
        ...(reasoning_details && reasoning_details.length > 0 && { reasoning_details }),
        ...(tool_calls.length > 0 && { tool_calls }),
        ...(images && images.length > 0 && { images }),
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
  images?: ChatCompletionContentPartImage[];
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
  const imageParts: ChatCompletionContentPartImage[] = [];
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
      } else if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || "image/png";
        const dataUri = `data:${mimeType};base64,${part.inlineData.data}`;
        imageParts.push({
          type: "image_url",
          image_url: {
            url: dataUri,
          },
        });
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

  // Add images if image parts were found
  if (imageParts.length > 0) {
    result.images = imageParts;
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
  const modelUsage = mapGoogleUsageToModelUsage(usage);
  return mapModelUsageToOpenAI(modelUsage);
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

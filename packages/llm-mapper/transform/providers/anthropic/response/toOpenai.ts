import {
  OpenAIResponseBody,
  OpenAIChoice,
  OpenAIToolCall,
  OpenAIAnnotation,
} from "../../../types/openai";
import {
  AnthropicResponseBody,
  AnthropicContentBlock,
} from "../../../types/anthropic";

// Anthropic Response Body -> OpenAI Response Body
export function toOpenAI(response: AnthropicResponseBody): OpenAIResponseBody {
  // Filter out server_tool_use and web_search_tool_result blocks - they're internal to Anthropic
  const textBlocks = response.content.filter((block) => block.type === "text");
  const toolUseBlocks = response.content.filter(
    (block) => block.type === "tool_use"
  );

  const { content, annotations } = buildContentAndAnnotations(textBlocks);

  const tool_calls = mapToolCalls(toolUseBlocks);

  const choice: OpenAIChoice = {
    index: 0,
    message: {
      role: "assistant",
      content: content || null,
      ...(tool_calls.length > 0 && { tool_calls }),
      ...(annotations.length > 0 && { annotations }),
    },
    finish_reason: mapStopReason(response.stop_reason),
    logprobs: null,
  };

  const anthropicUsage = response.usage;
  const cachedTokens = anthropicUsage.cache_read_input_tokens ?? 0;
  const cacheWriteTokens = anthropicUsage.cache_creation_input_tokens ?? 0;

  return {
    id: response.id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000), // Current timestamp in seconds
    model: response.model,
    choices: [choice],
    usage: {
      prompt_tokens: anthropicUsage.input_tokens,
      completion_tokens: anthropicUsage.output_tokens,
      total_tokens: anthropicUsage.input_tokens + anthropicUsage.output_tokens,
      ...((cachedTokens > 0 || cacheWriteTokens > 0) && {
        prompt_tokens_details: {
          cached_tokens: cachedTokens,
          audio_tokens: 0,

          ...(cacheWriteTokens > 0 && {
            cache_write_tokens: cacheWriteTokens,
            cache_write_details: {
              write_5m_tokens:
                anthropicUsage.cache_creation?.ephemeral_5m_input_tokens ??
                cachedTokens ??
                0,
              write_1h_tokens:
                anthropicUsage.cache_creation?.ephemeral_1h_input_tokens ?? 0,
            },
          }),
        },
      }),
      completion_tokens_details: {
        reasoning_tokens: 0,
        audio_tokens: 0,
        accepted_prediction_tokens: 0,
        rejected_prediction_tokens: 0,
      },
    },
  };
}

// Helper function to build content and annotations from text blocks
function buildContentAndAnnotations(textBlocks: AnthropicContentBlock[]): {
  content: string;
  annotations: OpenAIAnnotation[];
} {
  let fullContent = "";
  const annotations: OpenAIAnnotation[] = [];

  for (const block of textBlocks) {
    const text = blockToString(block);
    const blockStartIndex = fullContent.length;

    // Convert Anthropic citations to OpenAI annotations
    if (block.citations && block.citations.length > 0) {
      // For each citation, find where the cited text appears in this block
      for (const citation of block.citations) {
        // The cited_text is what was quoted from the source
        // We need to find where in the block's text this citation applies
        // Since Anthropic puts citations on blocks that reference the source,
        // we'll use the entire block text as the cited portion
        const blockEndIndex = blockStartIndex + text.length;

        annotations.push({
          type: "url_citation",
          url_citation: {
            url: citation.url,
            title: citation.title,
            content: citation.cited_text, // This is the source text from the webpage
            start_index: blockStartIndex,
            end_index: blockEndIndex,
          },
        });
      }
    }

    fullContent += text;
  }

  return { content: fullContent, annotations };
}

// Helper function to map tool uses from content blocks
function mapToolCalls(
  toolUseBlocks: AnthropicContentBlock[]
): OpenAIToolCall[] {
  return toolUseBlocks
    .filter((block) => block.type === "tool_use" && block.id && block.name)
    .map((block) => ({
      id: block.id!,
      type: "function" as const,
      function: {
        name: block.name!,
        arguments: JSON.stringify(block.input || {}),
      },
    }));
}

function blockToString(block: AnthropicContentBlock): string {
  if (block.type === "text") {
    return block.text || "";
  } else if (block.type === "thinking" && block.thinking) {
    // OpenAI reasoning is not on chat completions API AFAIK
    return "";
  }
  return "";
}

function mapStopReason(
  reason: AnthropicResponseBody["stop_reason"]
): OpenAIChoice["finish_reason"] {
  switch (reason) {
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "max_tokens":
      return "length";
    case "tool_use":
      return "tool_calls";
    default:
      return "stop";
  }
}

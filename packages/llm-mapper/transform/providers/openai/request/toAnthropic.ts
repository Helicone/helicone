import {
  AnthropicRequestBody,
  AnthropicContentBlock,
  AnthropicTool,
  AnthropicWebSearchTool,
  AnthropicToolChoice,
} from "../../../types/anthropic";
import {
  HeliconeChatCompletionContentPart,
  HeliconeChatCreateParams,
} from "@helicone-package/prompts/types";
import { Plugin } from "@helicone-package/cost/models/types";

export function toAnthropic(
  openAIBody: HeliconeChatCreateParams,
  providerModelId?: string,
  plugins?: Plugin[],
  options?: {
    includeCacheBreakpoints?: boolean;
  }
): AnthropicRequestBody {
  const includeCache = options?.includeCacheBreakpoints !== false;
  const antBody: AnthropicRequestBody = {
    model: providerModelId || openAIBody.model,
    messages: [],
    max_tokens:
      openAIBody.max_completion_tokens ?? openAIBody.max_tokens ?? 1024,
    temperature: openAIBody.temperature ?? undefined,
    top_p: openAIBody.top_p ?? undefined,

    stream: openAIBody.stream ?? undefined,
  };

  if (openAIBody.reasoning_effort) {
    if (!openAIBody.reasoning_options) {
      throw new Error("reasoning_options are required for Anthropic models");
    }
    
    if (!openAIBody.reasoning_options.budget_tokens) {
      throw new Error("reasoning_options.budget_tokens are required for Anthropic models");
    }

    antBody.thinking = {
      type: "enabled",
      budget_tokens: openAIBody.reasoning_options.budget_tokens,
    };

    // temperature 1 is required for Anthropic models to enable reasoning
    antBody.temperature = 1;
  }

  if (openAIBody.stop) {
    antBody.stop_sequences = Array.isArray(openAIBody.stop)
      ? openAIBody.stop
      : openAIBody.stop
        ? [openAIBody.stop]
        : [];
  }

  const { messages, system } = extractSystemMessage(
    openAIBody.messages,
    includeCache
  );
  antBody.messages = mapMessages(messages, includeCache);
  if (system) {
    antBody.system = system;
  }

  if (antBody.messages.length === 0) {
    throw new Error(
      "Request with Anthropic models must contain at least one non-system message."
    );
  }

  const user_id =
    openAIBody.safety_identifier ||
    openAIBody.prompt_cache_key ||
    openAIBody.user;
  if (user_id) {
    antBody.metadata = { user_id };
  }

  // Map tools from OpenAI format to Anthropic format
  if (openAIBody.tools) {
    antBody.tools = mapTools(openAIBody.tools);
  }

  // Map web search plugin to Anthropic format
  const webSearchTool = mapWebSearch(plugins);
  if (webSearchTool) {
    antBody.tools = antBody.tools || [];

    // Check if web search tool is not already present
    const hasWebSearch = antBody.tools.some(
      (tool) =>
        ("type" in tool && tool.type === "web_search_20250305") ||
        ("name" in tool && tool.name === "web_search")
    );

    if (!hasWebSearch) {
      antBody.tools.push(webSearchTool);
    }
  }

  // Map tool_choice from OpenAI format to Anthropic format
  if (openAIBody.tool_choice) {
    antBody.tool_choice = mapToolChoice(openAIBody.tool_choice);
  }

  // Legacy function_call/functions not supported
  if (openAIBody.function_call || openAIBody.functions) {
    throw new Error(
      "Legacy function_call and functions are not supported. Use tools instead."
    );
  }

  if (openAIBody.logit_bias) {
    throw new Error("Logit bias is not supported");
  }

  // if and only if the user did not provide any cache control breakpoints,
  // add a default ephemeral 5m breakpoint at the end of the content.
  if (includeCache && !hasAnyCacheControl(openAIBody)) {
    appendDefaultCacheBreakpoint(antBody);
  }

  return antBody;
}

function openAIContentToAnthropicContent(
  content: string | HeliconeChatCompletionContentPart[] | null,
  includeCache: boolean
): string | AnthropicContentBlock[] {
  if (content === null) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return content.map((part) => {
    switch (part.type) {
      case "text":
        return {
          type: "text",
          text: part.text,
          ...(includeCache && part.cache_control
            ? { cache_control: part.cache_control }
            : {}),
        };
      case "image_url":
        // expected format: { type: "image_url", image_url: { url: string } }
        // where url: is either a link, or `data:image/{format};base64,{base64_encoded_image}`
        const url = part.image_url.url;
        if (url.startsWith("data:")) {
          // format: data:image/jpeg;base64,{base64_data}
          const parts = url.split(",");
          if (parts.length !== 2) {
            throw new Error(`Invalid data URI format: ${url}`);
          }
          const [mimeType, base64Data] = parts;
          const mediaParts = mimeType.split(":");
          if (mediaParts.length < 2) {
            throw new Error(`Invalid data URI MIME type: ${mimeType}`);
          }
          const mediaType = mediaParts[1].split(";")[0];
          return {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Data,
            },
            ...(includeCache && part.cache_control
              ? { cache_control: part.cache_control }
              : {}),
          };
        } else {
          return {
            type: "image",
            source: {
              type: "url",
              url: url,
            },
            ...(includeCache && part.cache_control
              ? { cache_control: part.cache_control }
              : {}),
          };
        }
      case "input_audio":
        // expected format: { type: "input_audio", input_audio: { data: base64str, format: "wav" }}
        throw new Error(`${part.type} is not supported by Anthropic Messages.`);
      case "document":
        // Anthropic document type - pass through as-is since it's already in Anthropic format
        // Document blocks are used for extended context features with citations
        return {
          type: "document",
          source: part.source,
          title: part.title,
          citations: part.citations,
          cache_control: part.cache_control,
        };
      case "file":
        // TODO: Chat Completions API does not support files whereas Anthropic Messages API does
        // would need to extend the HeliconeChatCreateParams types to support files, and map it to the Anthropic format:
        // { type: "image", source: { type: "file", file_id: string }}
        throw new Error(`Unsupported content type: ${part.type}`);
      default:
        throw new Error(`Unsupported content type: ${(part as any).type}`);
    }
  });
}

function hasAnyCacheControl(body: HeliconeChatCreateParams): boolean {
  const msgs = body.messages || [];
  for (const m of msgs) {
    if ((m as any).cache_control) {
      return true;
    }
    const content = (m as any).content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if ((part as any)?.cache_control) {
          return true;
        }
      }
    }
  }
  return false;
}

function appendDefaultCacheBreakpoint(antBody: AnthropicRequestBody) {
  const defaultCache = { type: "ephemeral" as const, ttl: "5m" as const };

  if (antBody.messages.length > 0) {
    const last = antBody.messages[antBody.messages.length - 1];
    if (typeof last.content === "string") {
      last.content = [
        {
          type: "text",
          text: last.content,
          cache_control: defaultCache,
        },
      ];
      return;
    }
    if (Array.isArray(last.content) && last.content.length > 0) {
      const idx = last.content.length - 1;
      const block = last.content[idx];
      last.content[idx] = {
        ...block,
        cache_control: defaultCache,
      } as AnthropicContentBlock;
      return;
    }
  }

  if (antBody.system && Array.isArray(antBody.system) && antBody.system.length > 0) {
    const idx = antBody.system.length - 1;
    const block = antBody.system[idx];
    antBody.system[idx] = {
      ...block,
      cache_control: defaultCache,
    } as AnthropicContentBlock;
    return;
  }

  // If system is a string and there are no messages, it's okay not to add it
}

function extractSystemMessage(
  messages: HeliconeChatCreateParams["messages"],
  includeCache: boolean
): {
  messages: HeliconeChatCreateParams["messages"];
  system?: string | AnthropicContentBlock[];
} {
  if (!messages) {
    return { messages: [], system: undefined };
  }
  const systemMessages = messages.filter((msg) => msg.role === "system");
  const otherMessages = messages.filter((msg) => msg.role !== "system");

  if (
    systemMessages.length === 1 &&
    typeof systemMessages[0].content === "string"
  ) {
    const content = systemMessages[0].content;
    if (!includeCache || !systemMessages[0].cache_control) {
      return {
        messages: otherMessages,
        system: content,
      };
    }
    return {
      messages: otherMessages,
      system: [
        {
          type: "text",
          text: systemMessages[0].content,
          ...(includeCache && systemMessages[0].cache_control
            ? { cache_control: systemMessages[0].cache_control }
            : {}),
        },
      ],
    };
  }

  const systemMessageBlocks: AnthropicContentBlock[] = [];
  for (const msg of systemMessages) {
    const convertedBlock = openAIContentToAnthropicContent(
      msg.content,
      includeCache
    );
    if (typeof convertedBlock === "string") {
      systemMessageBlocks.push({
        type: "text",
        text: convertedBlock,
        ...(includeCache && msg.cache_control
          ? { cache_control: msg.cache_control }
          : {}),
      });
    } else {
      systemMessageBlocks.push(...convertedBlock);
    }
  }

  return {
    messages: otherMessages,
    system: systemMessageBlocks,
  };
}

function mapMessages(
  messages: HeliconeChatCreateParams["messages"],
  includeCache: boolean
): AnthropicRequestBody["messages"] {
  if (!messages) {
    return [];
  }

  return messages.map((message): AnthropicRequestBody["messages"][0] => {
    if (message.role === "function") {
      throw new Error("Function messages are not supported");
    }

    if (message.role === "tool") {
      return {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: message.tool_call_id,
            content: typeof message.content === "string" ? message.content : "",
            ...(includeCache && message.cache_control
              ? { cache_control: message.cache_control }
              : {}),
          },
        ],
      };
    }

    const antMessage: AnthropicRequestBody["messages"][0] = {
      role: message.role as "user" | "assistant",
      content: "n/a",
    };

    if (message.role === "assistant" || message.role === "user") {
      const processedToolCallContent: AnthropicContentBlock[] = [];

      if (message.role === "assistant" && message.tool_calls) {
        message.tool_calls.forEach((toolCall) => {
          if (toolCall.type === "function") {
            processedToolCallContent.push({
              type: "tool_use",
              id: toolCall.id,
              name: toolCall.function.name,
              input: JSON.parse(toolCall.function.arguments || "{}"),
              // TODO: add cache_control support to message.tool_calls in types
            });
          }
        });
      }

      const hasReasoningDetails = message.role === "assistant" && message.reasoning_details && message.reasoning_details?.length > 0;
      const hasReasoning = message.role === "assistant" && !!message.reasoning;
      let processedContent: string | AnthropicContentBlock[] = [];

      // Thinking blocks MUST be first in Anthropic format to be valid
      if (message.reasoning_details && hasReasoningDetails) {
        // Use reasoning_details when available (includes signatures for multi-turn)
        for (const detail of message.reasoning_details) {
          processedContent.push({
            type: "thinking",
            thinking: detail.thinking,
            signature: detail.signature,
          });
        }
      } else if (hasReasoning) {
        // Fallback to simple reasoning string (no signature - may fail on multi-turn)
        processedContent.push({
          type: "thinking",
          thinking: message.reasoning,
        });
      }

      if (message.content) {
        const convertedContent = openAIContentToAnthropicContent(
          message.content,
          includeCache
        );
        if (typeof convertedContent === "string") {
          // if the message requires forming a content array
          const hasMsgCache = includeCache && !!(message as any).cache_control;
          if (hasMsgCache || processedToolCallContent.length > 0 || hasReasoning) {
            processedContent.push({
              type: "text",
              text: convertedContent,
              ...(includeCache && (message as any).cache_control
                ? { cache_control: (message as any).cache_control }
                : {}),
            });
          } else {
            // there was no cache control breakpoint, the content was just string,
            // no tool calls, and no reasoning, so we create a non-content array message.
            antMessage.content = convertedContent;
            return antMessage;
          }
        } else {
          processedContent.push(...convertedContent);
        }
      }
      processedContent.push(...processedToolCallContent);

      antMessage.content = processedContent;
      return antMessage;
    }
    antMessage.content = openAIContentToAnthropicContent(
      message.content,
      includeCache
    );
    return antMessage;
  });
}

function mapTools(
  tools: HeliconeChatCreateParams["tools"]
): (AnthropicTool | AnthropicWebSearchTool)[] {
  if (!tools) return [];

  return tools.map((tool) => {
    if (tool.type !== "function") {
      throw new Error(`Unsupported tool type: ${tool.type}`);
    }

    // Check if this is a web search tool
    if (tool.function.name === "web_search") {
      const params = (tool.function.parameters as any) || {};
      const webSearchTool: AnthropicWebSearchTool = {
        type: "web_search_20250305",
        name: "web_search",
      };

      // Map optional parameters
      if (params.max_uses !== undefined) {
        webSearchTool.max_uses = params.max_uses;
      }
      if (params.allowed_domains !== undefined) {
        webSearchTool.allowed_domains = params.allowed_domains;
      }
      if (params.user_location !== undefined) {
        webSearchTool.user_location = params.user_location;
      }

      return webSearchTool;
    }

    // Regular tool mapping
    const inputSchema = (tool.function.parameters as any) || {
      type: "object",
      properties: {},
    };

    return {
      name: tool.function.name,
      description: tool.function.description || "",
      input_schema: {
        type: "object" as const,
        properties: inputSchema.properties || {},
        required: inputSchema.required,
      },
    };
  });
}

function mapToolChoice(
  toolChoice: HeliconeChatCreateParams["tool_choice"]
): AnthropicToolChoice {
  if (!toolChoice) {
    return { type: "auto" };
  }

  if (typeof toolChoice === "string") {
    switch (toolChoice) {
      case "auto":
        return { type: "auto" };
      case "none":
        return { type: "auto" };
      default:
        throw new Error(`Unsupported tool_choice string: ${toolChoice}`);
    }
  }

  if (typeof toolChoice === "object" && toolChoice.type === "function") {
    return {
      type: "tool",
      name: toolChoice.function.name,
    };
  }

  throw new Error("Unsupported tool_choice format");
}

function mapWebSearch(
  plugins?: Plugin[]
): AnthropicWebSearchTool | null {
  if (!plugins || plugins.length === 0) {
    return null;
  }

  const webPlugin = plugins.find((p) => p.id === "web");
  if (!webPlugin) {
    return null;
  }

  // Extract web search specific config
  const { id, ...webConfig } = webPlugin as any;

  const webSearchTool: AnthropicWebSearchTool = {
    type: "web_search_20250305",
    name: "web_search",
  };

  // Map optional parameters if they exist
  if (webConfig.max_uses !== undefined) {
    webSearchTool.max_uses = webConfig.max_uses;
  }
  if (webConfig.allowed_domains !== undefined) {
    webSearchTool.allowed_domains = webConfig.allowed_domains;
  }
  if (webConfig.blocked_domains !== undefined) {
    webSearchTool.blocked_domains = webConfig.blocked_domains;
  }
  if (webConfig.user_location !== undefined) {
    webSearchTool.user_location = webConfig.user_location;
  }

  return webSearchTool;
}

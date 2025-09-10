import { AntRequestBody, ContentBlock, AnthropicTool, AnthropicToolChoice } from "../../anthropic/request/types";
import { OpenAIRequestBody } from "./types";

export function toAnthropic(openAIBody: OpenAIRequestBody): AntRequestBody {
  const antBody: AntRequestBody = {
    model: mapModel(openAIBody.model),
    messages: [],
    max_tokens: openAIBody.max_tokens ?? 1024,
    temperature: openAIBody.temperature,
    top_p: openAIBody.top_p,

    stream: openAIBody.stream,
  };

  if (openAIBody.stop) {
    antBody.stop_sequences = Array.isArray(openAIBody.stop)
      ? openAIBody.stop
      : openAIBody.stop
      ? [openAIBody.stop]
      : [];
  }

  const { messages, system } = extractSystemMessage(openAIBody.messages);
  antBody.messages = mapMessages(messages);
  if (system) {
    antBody.system = system;
  }

  if (openAIBody.user) {
    antBody.metadata = { user_id: openAIBody.user };
  }

  // Map tools from OpenAI format to Anthropic format
  if (openAIBody.tools) {
    antBody.tools = mapTools(openAIBody.tools);
  }

  // Map tool_choice from OpenAI format to Anthropic format
  if (openAIBody.tool_choice) {
    antBody.tool_choice = mapToolChoice(openAIBody.tool_choice);
  }

  // Legacy function_call/functions not supported
  if (openAIBody.function_call || openAIBody.functions) {
    throw new Error("Legacy function_call and functions are not supported. Use tools instead.");
  }

  if (openAIBody.logit_bias) {
    throw new Error("Logit bias is not supported");
  }

  return antBody;
}

function extractSystemMessage(messages: OpenAIRequestBody["messages"]): {
  messages: OpenAIRequestBody["messages"];
  system?: string;
} {
  const systemMessage = messages.find((msg) => msg.role === "system");
  const otherMessages = messages.filter((msg) => msg.role !== "system");

  return {
    messages: otherMessages,
    system: systemMessage?.content as string | undefined,
  };
}

function mapModel(model: string): string {
  if (model.includes('claude-3.5-haiku')) {
    return 'claude-3-5-haiku-20241022';
  } else if (model.includes('claude-3.5-sonnet')) {
    return 'claude-3-5-sonnet-latest';
  }
  return model;
}

function mapMessages(
  messages: OpenAIRequestBody["messages"]
): AntRequestBody["messages"] {
  return messages.map((message): AntRequestBody["messages"][0] => {
    if (message.role === "function") {
      throw new Error("Function messages are not supported");
    }

    const antMessage: AntRequestBody["messages"][0] = {
      role: message.role as "user" | "assistant",
      content: "n/a",
    };

    if (typeof message.content === "string") {
      if (message.content.length === 0) {
        antMessage.content = "n/a";
      } else {
        antMessage.content = message.content;
      }
    } else if (Array.isArray(message.content)) {
      antMessage.content = message.content.map((item): ContentBlock => {
        if (item.type === "text") {
          return { type: "text", text: item.text || "" };
        } else if (item.type === "image_url" && item.image_url) {
          const url = item.image_url.url;
          return {
            type: "image",
            source: {
              type: url.startsWith("data:") ? "base64" : "url",
              media_type: url.startsWith("data:")
                ? url.split(";")[0].split(":")[1]
                : `image/${url.split(".").pop()}`,
              data: url.startsWith("data:") ? url.split(",")[1] : url,
            },
          };
        }
        throw new Error(`Unsupported content type: ${item.type}`);
      });
    } else if (message.content === null) {
      antMessage.content = " ";
    } else {
      throw new Error("Unsupported message content type");
    }

    return antMessage;
  });
}

function mapTools(tools: OpenAIRequestBody["tools"]): AnthropicTool[] {
  if (!tools) return [];
  
  return tools.map((tool) => {
    if (tool.type !== "function") {
      throw new Error(`Unsupported tool type: ${tool.type}`);
    }

    const inputSchema = tool.function.parameters as any || {
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

function mapToolChoice(toolChoice: OpenAIRequestBody["tool_choice"]): AnthropicToolChoice {
  if (!toolChoice) {
    return { type: "auto" };
  }

  if (typeof toolChoice === "string") {
    switch (toolChoice) {
      case "auto":
        return { type: "auto" };
      case "none":
        // Anthropic doesn't have "none", so we'll omit tools entirely
        // This should be handled at a higher level
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

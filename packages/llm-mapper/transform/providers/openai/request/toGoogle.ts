import {
  HeliconeChatCompletionContentPart,
  HeliconeChatCreateParams,
} from "@helicone-package/prompts/types";

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data: string;
  };
  fileData?: {
    fileUri: string;
  };
  functionCall?: {
    name?: string;
    args?: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
  };
};

type GeminiContent = {
  role: "user" | "model" | "system";
  parts: GeminiPart[];
};

type GeminiTool = {
  functionDeclarations: Array<{
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  }>;
};

type GeminiGenerationConfig = {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  candidateCount?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
};

type GeminiToolConfig = {
  function_calling_config: {
    mode: "AUTO" | "ANY" | "NONE";
    allowed_function_names?: string[];
  };
};

export interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  system_instruction?: GeminiContent;
  generationConfig?: GeminiGenerationConfig;
  tools?: GeminiTool[];
  toolConfig?: GeminiToolConfig;
}

type ChatCompletionMessage =
  NonNullable<HeliconeChatCreateParams["messages"]>[number];

export function toGoogle(
  openAIBody: HeliconeChatCreateParams
): GeminiGenerateContentRequest {
  const messages = openAIBody.messages ?? [];
  if (messages.length === 0) {
    throw new Error("Gemini models require at least one message.");
  }

  const contents: GeminiContent[] = [];
  const systemParts: GeminiPart[] = [];

  for (const message of messages) {
    if (!message) {
      continue;
    }

    if (message.role === "system" || message.role === "developer") {
      systemParts.push(...mapContentToGeminiParts(message.content));
      continue;
    }

    if (message.role === "tool" || message.role === "function") {
      const responsePart = mapToolResponse(message);
      if (responsePart) {
        contents.push({
          role: "user",
          parts: [responsePart],
        });
      }
      continue;
    }

    const role = mapRole(message.role);
    const parts = mapContentToGeminiParts(message.content);

    if (message.role === "assistant") {
      const toolCallParts = mapToolCallsToParts(message);
      parts.push(...toolCallParts);
    }

    if (parts.length === 0) {
      continue;
    }

    contents.push({
      role,
      parts,
    });
  }

  const geminiBody: GeminiGenerateContentRequest = {
    contents,
  };

  if (systemParts.length > 0) {
    geminiBody.system_instruction = {
      role: "system",
      parts: systemParts,
    };
  }

  const generationConfig = buildGenerationConfig(openAIBody);
  if (generationConfig) {
    geminiBody.generationConfig = generationConfig;
  }

  const tools = buildTools(openAIBody);
  if (tools) {
    geminiBody.tools = tools;

    const toolConfig = buildToolConfig(openAIBody.tool_choice);
    if (toolConfig) {
      geminiBody.toolConfig = toolConfig;
    }
  }

  return geminiBody;
}

function buildGenerationConfig(
  body: HeliconeChatCreateParams
): GeminiGenerationConfig | undefined {
  const maxOutputTokens =
    body.max_output_tokens ??
    body.max_completion_tokens ??
    body.max_tokens ??
    undefined;

  const stopSequences = Array.isArray(body.stop)
    ? body.stop
    : body.stop
      ? [body.stop]
      : undefined;

  const config: GeminiGenerationConfig = {};

  if (body.temperature !== undefined) {
    config.temperature = body.temperature;
  }
  if (body.top_p !== undefined) {
    config.topP = body.top_p;
  }
  if (body.top_k !== undefined) {
    config.topK = body.top_k;
  }
  if (maxOutputTokens !== undefined) {
    config.maxOutputTokens = maxOutputTokens;
  }
  if (stopSequences && stopSequences.length > 0) {
    config.stopSequences = stopSequences;
  }
  if (body.n !== undefined) {
    config.candidateCount = body.n;
  }
  if (body.presence_penalty !== undefined) {
    config.presencePenalty = body.presence_penalty;
  }
  if (body.frequency_penalty !== undefined) {
    config.frequencyPenalty = body.frequency_penalty;
  }

  return Object.keys(config).length > 0 ? config : undefined;
}

function buildTools(body: HeliconeChatCreateParams): GeminiTool[] | undefined {
  if (!body.tools || body.tools.length === 0) {
    return undefined;
  }

  const functions = body.tools
    .filter((tool) => tool.type === "function" && tool.function)
    .map((tool) => ({
      name: tool.function!.name,
      description: tool.function!.description,
      parameters: tool.function!.parameters,
    }));

  if (functions.length === 0) {
    return undefined;
  }

  return [
    {
      functionDeclarations: functions,
    },
  ];
}

function buildToolConfig(
  toolChoice: HeliconeChatCreateParams["tool_choice"]
): GeminiToolConfig | undefined {
  if (!toolChoice) {
    return undefined;
  }

  if (toolChoice === "none") {
    return {
      function_calling_config: {
        mode: "NONE",
      },
    };
  }

  if (toolChoice === "auto") {
    return {
      function_calling_config: {
        mode: "AUTO",
      },
    };
  }

  if (
    typeof toolChoice === "object" &&
    toolChoice.type === "function" &&
    toolChoice.function?.name
  ) {
    return {
      function_calling_config: {
        mode: "ANY",
        allowed_function_names: [toolChoice.function.name],
      },
    };
  }

  return undefined;
}

function mapRole(role: ChatCompletionMessage["role"]): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

function mapContentToGeminiParts(
  content: ChatCompletionMessage["content"]
): GeminiPart[] {
  if (!content) {
    return [];
  }

  if (typeof content === "string") {
    return content.length > 0 ? [{ text: content }] : [];
  }

  const parts: GeminiPart[] = [];

  for (const part of content as HeliconeChatCompletionContentPart[]) {
    if (!part) {
      continue;
    }

    switch (part.type) {
      case "text":
        if (part.text?.length) {
          parts.push({ text: part.text });
        }
        break;
      case "image_url":
        if (part.image_url?.url) {
          const dataUri = part.image_url.url;
          if (dataUri.startsWith("data:")) {
            const [meta, data] = dataUri.split(",");
            const mimeType = meta.split(";")[0].replace("data:", "");
            parts.push({
              inlineData: {
                mimeType,
                data,
              },
            });
          } else {
            parts.push({
              fileData: { fileUri: dataUri },
            });
          }
        }
        break;
      default:
        break;
    }
  }

  return parts;
}

function mapToolCallsToParts(message: ChatCompletionMessage): GeminiPart[] {
  const parts: GeminiPart[] = [];
  const toolCalls = (message as any).tool_calls;
  const legacyCall = (message as any).function_call;

  if (Array.isArray(toolCalls)) {
    for (const toolCall of toolCalls) {
      parts.push({
        functionCall: {
          name: toolCall.function?.name,
          args: parseArguments(toolCall.function?.arguments),
        },
      });
    }
  } else if (legacyCall) {
    parts.push({
      functionCall: {
        name: legacyCall.name,
        args: parseArguments(legacyCall.arguments),
      },
    });
  }

  return parts;
}

function mapToolResponse(message: ChatCompletionMessage): GeminiPart | null {
  const response = parseArguments(message.content);
  const name = (message as any).name || (message as any).tool_call_id || "tool";

  if (!response) {
    return null;
  }

  return {
    functionResponse: {
      name,
      response,
    },
  };
}

function parseArguments(
  value?: string | null
): Record<string, any> | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    // If the parsed value is a primitive (number, string, boolean, null), wrap it
    // Google's API requires functionResponse.response to be an object (Struct)
    if (typeof parsed !== 'object' || parsed === null) {
      return { result: parsed };
    }

    return parsed;
  } catch {
    return { raw: value };
  }
}

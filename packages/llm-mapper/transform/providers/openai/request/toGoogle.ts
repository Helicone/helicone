import {
  HeliconeChatCompletionContentPart,
  HeliconeChatCreateParams,
} from "@helicone-package/prompts/types";
import { ChatCompletionTool } from "openai/resources/chat/completions";

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

type ExtendedHeliconeChatCreateParams = HeliconeChatCreateParams & {
  max_output_tokens?: number | null;
  top_k?: number | null;
};

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
  const bodyWithExtensions = body as ExtendedHeliconeChatCreateParams;

  const getNumberOrUndefined = (
    value?: number | null
  ): number | undefined => {
    return typeof value === "number" ? value : undefined;
  };

  const maxOutputTokens =
    getNumberOrUndefined(bodyWithExtensions.max_output_tokens) ??
    getNumberOrUndefined(body.max_completion_tokens) ??
    getNumberOrUndefined(body.max_tokens) ??
    undefined;

  const stopSequences = Array.isArray(body.stop)
    ? body.stop
    : body.stop
      ? [body.stop]
      : undefined;

  const config: GeminiGenerationConfig = {};

  const temperature = getNumberOrUndefined(body.temperature);
  if (temperature !== undefined) {
    config.temperature = temperature;
  }
  const topP = getNumberOrUndefined(body.top_p);
  if (topP !== undefined) {
    config.topP = topP;
  }
  const topK = getNumberOrUndefined(bodyWithExtensions.top_k);
  if (topK !== undefined) {
    config.topK = topK;
  }
  if (maxOutputTokens !== undefined) {
    config.maxOutputTokens = maxOutputTokens;
  }
  if (stopSequences && stopSequences.length > 0) {
    config.stopSequences = stopSequences;
  }
  const candidateCount = getNumberOrUndefined(body.n);
  if (candidateCount !== undefined) {
    config.candidateCount = candidateCount;
  }
  const presencePenalty = getNumberOrUndefined(body.presence_penalty);
  if (presencePenalty !== undefined) {
    config.presencePenalty = presencePenalty;
  }
  const frequencyPenalty = getNumberOrUndefined(body.frequency_penalty);
  if (frequencyPenalty !== undefined) {
    config.frequencyPenalty = frequencyPenalty;
  }

  return Object.keys(config).length > 0 ? config : undefined;
}

function buildTools(body: HeliconeChatCreateParams): GeminiTool[] | undefined {
  if (!body.tools || body.tools.length === 0) {
    return undefined;
  }

  type FunctionTool = ChatCompletionTool & {
    type: "function";
    function?: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  };

  const isFunctionTool = (tool: ChatCompletionTool): tool is FunctionTool =>
    tool.type === "function" && Boolean((tool as any).function);

  const functions = body.tools
    .filter(isFunctionTool)
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

            let mimeType = meta.split(";")[0].replace("data:", "");
            if (!mimeType || mimeType.trim() === "") {
              mimeType = "application/octet-stream";
            }

            parts.push({
              inlineData: {
                mimeType,
                data,
              },
            });
          } else {
            let mimeType: string | undefined = undefined;

            try {
              const urlObj = new URL(dataUri);
              const pathname = urlObj.pathname.toLowerCase();

              if (pathname.endsWith(".png")) mimeType = "image/png";
              else if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg"))
                mimeType = "image/jpeg";
              else if (pathname.endsWith(".gif")) mimeType = "image/gif";
              else if (pathname.endsWith(".webp")) mimeType = "image/webp";
              else if (pathname.endsWith(".bmp")) mimeType = "image/bmp";
              else if (pathname.endsWith(".svg")) mimeType = "image/svg+xml";
            } catch {
              // non-URL or extension not detectable
            }

            parts.push({
              fileData: {
                fileUri: dataUri,
                ...(mimeType ? { mimeType } : {}),
              },
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
  value?: string | HeliconeChatCompletionContentPart[] | null
): Record<string, any> | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const textContent = value
      .map((part) => (part.type === "text" ? part.text : undefined))
      .filter((text): text is string => !!text?.length)
      .join("\n");

    if (!textContent) {
      return undefined;
    }

    value = textContent;
  }

  if (typeof value !== "string") {
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

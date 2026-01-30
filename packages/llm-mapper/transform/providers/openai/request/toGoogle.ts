import { GeminiContent, GeminiGenerateContentRequest, GeminiGenerationConfig, GeminiImageConfig, GeminiPart, GeminiThinkingConfig, GeminiTool, GeminiToolConfig, GoogleReasoningOptions } from "../../../types/google";
import {
  HeliconeChatCompletionContentPart,
  HeliconeChatCreateParams,
  HeliconeChatCompletionMessageParam,
  HeliconeImageGenerationConfig,
} from "@helicone-package/prompts/types";
import { ChatCompletionTool } from "openai/resources/chat/completions";

type ChatCompletionMessage = NonNullable<HeliconeChatCreateParams["messages"]>[number];

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
    const parts: GeminiPart[] = [];

    // For assistant messages with reasoning_details, add thinking parts FIRST
    // (similar to Anthropic pattern where thinking blocks must precede content)
    if (message.role === "assistant") {
      const reasoningDetails = (message as any).reasoning_details;
      if (reasoningDetails && Array.isArray(reasoningDetails)) {
        for (const detail of reasoningDetails) {
          if (detail.thinking) {
            parts.push({
              text: detail.thinking,
              thought: true,
              ...(detail.signature && { thoughtSignature: detail.signature }),
            });
          }
        }
      }
    }

    // Add regular content parts
    parts.push(...mapContentToGeminiParts(message.content));

    if (message.role === "assistant") {
      const toolCallParts = mapToolCallsToParts(message);
      parts.push(...toolCallParts);

      const imageParts = mapImagesToParts(message);
      parts.push(...imageParts);
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
  const getNumberOrUndefined = (
    value?: number | null
  ): number | undefined => {
    return typeof value === "number" ? value : undefined;
  };

  const maxOutputTokens =
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
  const topK = getNumberOrUndefined(body.top_k);
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

  // Handle reasoning/thinking configuration
  const thinkingConfig = buildThinkingConfig(body, maxOutputTokens);
  if (thinkingConfig) {
    config.thinkingConfig = thinkingConfig;
  }

  const imageConfig = buildImageConfig(body);
  if (imageConfig) {
    config.imageConfig = imageConfig;
  }

  // Handle response_format for structured output
  const responseFormatConfig = buildResponseFormatConfig(body);
  if (responseFormatConfig) {
    if (responseFormatConfig.responseMimeType) {
      config.responseMimeType = responseFormatConfig.responseMimeType;
    }
    if (responseFormatConfig.responseSchema) {
      config.responseSchema = responseFormatConfig.responseSchema;
    }
  }

  return Object.keys(config).length > 0 ? config : undefined;
}

/**
 * Converts OpenAI's response_format to Google's responseMimeType and responseSchema.
 *
 * OpenAI format:
 * - { type: "text" } -> No special handling (default)
 * - { type: "json_object" } -> responseMimeType: "application/json"
 * - { type: "json_schema", json_schema: { schema: {...} } } -> responseMimeType + responseSchema
 *
 * Google format:
 * - generationConfig.responseMimeType: "application/json"
 * - generationConfig.responseSchema: { type: "object", properties: {...} }
 */
function buildResponseFormatConfig(
  body: HeliconeChatCreateParams
): { responseMimeType?: string; responseSchema?: Record<string, any> } | undefined {
  const responseFormat = body.response_format;

  if (!responseFormat) {
    return undefined;
  }

  // Handle different response_format types
  if (responseFormat.type === "text") {
    // Default behavior, no special config needed
    return undefined;
  }

  if (responseFormat.type === "json_object") {
    // Simple JSON mode without schema
    return {
      responseMimeType: "application/json",
    };
  }

  if (responseFormat.type === "json_schema") {
    const jsonSchema = (responseFormat as any).json_schema;
    if (!jsonSchema?.schema) {
      // Fallback to simple JSON mode if no schema provided
      return {
        responseMimeType: "application/json",
      };
    }

    // Strip OpenAI-specific fields from the schema (like additionalProperties)
    const cleanedSchema = stripOpenAISchemaFields(jsonSchema.schema);

    return {
      responseMimeType: "application/json",
      responseSchema: cleanedSchema,
    };
  }

  return undefined;
}

/**
 * Checks if the model is an image generation model that doesn't support thinking.
 * Image generation models like gemini-3-pro-image-preview don't support thinkingLevel.
 */
function isImageGenerationModel(model: string): boolean {
  const modelLower = model.toLowerCase();
  return modelLower.includes("-image") || modelLower.includes("image-");
}

/**
 * Checks if the model supports thinkingLevel (Gemini 3+ models, excluding image generation models).
 * Gemini 2.5 models only support thinkingBudget.
 * Image generation models don't support thinking at all.
 */
function supportsThinkingLevel(model: string): boolean {
  const modelLower = model.toLowerCase();

  // Image generation models don't support thinking
  if (isImageGenerationModel(modelLower)) {
    return false;
  }

  const geminiMatch = modelLower.match(/gemini-(\d+)/);
  if (geminiMatch) {
    const majorVersion = parseInt(geminiMatch[1], 10);
    return majorVersion >= 3;
  }
  return false;
}

/**
 * Maps OpenAI reasoning_effort to Google thinkingLevel.
 */
function mapReasoningEffortToThinkingLevel(
  effort: "low" | "medium" | "high"
): "low" | "high" {
  // Google only supports "low" and "high", so map "medium" to "low"
  return effort === "high" ? "high" : "low";
}

/**
 * Builds the Google thinking configuration from OpenAI reasoning parameters.
 *
 * IMPORTANT: For Google models, reasoning_effort is REQUIRED to enable thinking.
 * budget_tokens alone does NOT enable thinking - it only sets the budget when
 * reasoning_effort is also provided. We have set up "low" as default for Gemini 3+ models.
 *
 * Supports:
 * - reasoning_effort: "low" | "medium" | "high" -> thinkingLevel (for Gemini 3+)
 *   or thinkingBudget: -1 (for Gemini 2.5 models that don't support thinkingLevel)
 * - reasoning_options.budget_tokens -> thinkingBudget (only when reasoning_effort is set)
 * - reasoning_options.thinking_level -> thinkingLevel (overrides reasoning_effort)
 *
 * If no reasoning_effort is provided, it defaults to "low".
 */
function buildThinkingConfig(
  body: HeliconeChatCreateParams,
  _maxOutputTokens?: number
): GeminiThinkingConfig | undefined {
  const model = body.model || "";
  const reasoningOptions = body.reasoning_options as
    | GoogleReasoningOptions
    | undefined;

  // If reasoning_options.thinking_level is explicitly set, use it
  if (reasoningOptions?.thinking_level !== undefined) {
    const thinkingConfig: GeminiThinkingConfig = {
      includeThoughts: true,
      thinkingLevel: reasoningOptions.thinking_level,
    };
    // Also apply budget_tokens if provided
    if (reasoningOptions.budget_tokens !== undefined) {
      thinkingConfig.thinkingBudget = reasoningOptions.budget_tokens;
    }
    return thinkingConfig;
  }

  // Determine if this is a Gemini 3+ model that supports thinking (excludes image generation models)
  const isGemini3PlusWithThinking =
    /gemini-3/.test(model.toLowerCase()) && !isImageGenerationModel(model);

  // Default to "low" for Gemini 3+ models (excluding image models), otherwise require explicit reasoning_effort
  const reasoningEffort = body.reasoning_effort ?? (isGemini3PlusWithThinking ? "low" : undefined);

  // If no reasoning_effort and not a reasoning model, disable thinking
  if (!reasoningEffort) {
    return {
      thinkingBudget: 0,
    };
  }

  const thinkingConfig: GeminiThinkingConfig = {
    includeThoughts: true,
  };

  const modelSupportsThinkingLevel = supportsThinkingLevel(model);

  // Handle reasoning_effort
  if (modelSupportsThinkingLevel) {
    // Gemini 3+ models: use thinkingLevel
    thinkingConfig.thinkingLevel = mapReasoningEffortToThinkingLevel(
      reasoningEffort as "low" | "medium" | "high"
    );
  } else {
    // Gemini 2.5 models: use dynamic thinkingBudget (-1)
    thinkingConfig.thinkingBudget = -1;
  }

  // Apply budget_tokens if provided (only effective when reasoning_effort is set)
  if (reasoningOptions?.budget_tokens !== undefined) {
    thinkingConfig.thinkingBudget = reasoningOptions.budget_tokens;
  }

  return thinkingConfig;
}

function buildImageConfig(body: HeliconeChatCreateParams): GeminiImageConfig | undefined {
  const heliconeImageConfig = body.image_generation;

  if (heliconeImageConfig === undefined) {
    return undefined;
  }

  const imageConfig: GeminiImageConfig = {
    aspectRatio: heliconeImageConfig.aspect_ratio,
    imageSize: heliconeImageConfig.image_size
  };
  return imageConfig;
}

/**
 * Recursively strips OpenAI-specific JSON Schema fields that Gemini doesn't recognize.
 *
 * OpenAI's strict mode requires additionalProperties: false on all object schemas,
 * but Gemini's API rejects this field with:
 * "Unknown name 'additionalProperties' at 'tools[0].function_declarations[0].parameters'"
 */
function stripOpenAISchemaFields(schema: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return schema;
  }

  // Create a shallow copy to avoid mutating the original
  const cleaned = { ...schema };

  // Remove OpenAI-specific fields
  delete cleaned.additionalProperties;

  // Recurse into properties
  if (cleaned.properties && typeof cleaned.properties === 'object') {
    cleaned.properties = Object.fromEntries(
      Object.entries(cleaned.properties).map(([key, value]) => [
        key,
        stripOpenAISchemaFields(value as Record<string, any>),
      ])
    );
  }

  // Handle array items (can be a single schema or array of schemas for tuple validation)
  if (cleaned.items) {
    if (Array.isArray(cleaned.items)) {
      cleaned.items = cleaned.items.map((item: Record<string, any>) =>
        stripOpenAISchemaFields(item)
      );
    } else {
      cleaned.items = stripOpenAISchemaFields(cleaned.items);
    }
  }

  // Handle allOf, anyOf, oneOf
  for (const combiner of ['allOf', 'anyOf', 'oneOf'] as const) {
    if (Array.isArray(cleaned[combiner])) {
      cleaned[combiner] = cleaned[combiner].map((subSchema: Record<string, any>) =>
        stripOpenAISchemaFields(subSchema)
      );
    }
  }

  // Handle $defs / definitions (JSON Schema references)
  for (const defsKey of ['$defs', 'definitions'] as const) {
    if (cleaned[defsKey] && typeof cleaned[defsKey] === 'object') {
      cleaned[defsKey] = Object.fromEntries(
        Object.entries(cleaned[defsKey]).map(([key, value]) => [
          key,
          stripOpenAISchemaFields(value as Record<string, any>),
        ])
      );
    }
  }

  return cleaned;
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
      parameters: stripOpenAISchemaFields(tool.function!.parameters),
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

/**
 * Maps images from assistant messages to Gemini inlineData parts.
 * This handles image outputs that were generated by previous model responses.
 */
function mapImagesToParts(message: HeliconeChatCompletionMessageParam): GeminiPart[] {
  const parts: GeminiPart[] = [];

  if (!message.images) {
    return parts;
  }

  for (const image of message.images) {
    if (image.type === "image_url" && image.image_url?.url) {
      const dataUri = image.image_url.url;
      if (dataUri.startsWith("data:")) {
        const [meta, data] = dataUri.split(",");
        let mimeType = meta.split(";")[0].replace("data:", "");
        if (!mimeType || mimeType.trim() === "") {
          mimeType = "image/png";
        }
        parts.push({
          inlineData: { mimeType, data },
        });
      }
    }
  }

  return parts;
}

import {
  ChatCompletionContentPart,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionDeveloperMessageParam,
  ChatCompletionFunctionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionAssistantMessageParam,
} from "openai/resources/chat/completions";

export type ALLOWED_VARIABLE_TYPE = "string" | "boolean" | "number";
export interface TemplateVariable {
  name: string;
  type: string;
  raw: string;
}

export interface ValidationError {
  variable: string;
  expected: string;
  value: any;
}

export interface SubstitutionResult {
  success: boolean;
  result?: any;
  errors?: ValidationError[];
}

export interface Prompt2025Version {
  id: string;
  model: string;
  prompt_id: string;
  major_version: number;
  minor_version: number;
  commit_message: string;
  environment?: string;

  created_at: string;

  s3_url?: string;

  // TODO: add another type for the user that created
  // it and union with this one for the info.
}

export interface Prompt2025 {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
}

export interface Prompt2025Input {
  request_id: string;
  version_id: string;
  inputs: Record<string, any>;
}

/**
 * Cache control configuration for Anthropic's prompt caching feature.
 * 
 * When using Anthropic models through the Helicone AI Gateway, you can enable
 * prompt caching to reduce costs and latency for repeated prompts.
 * 
 * @example
 * ```typescript
 * const message = {
 *   role: "user",
 *   content: "Analyze this document...",
 *   cache_control: { type: "ephemeral", ttl: "5m" }
 * };
 * ```
 */
export interface CacheControl {
  /** Cache type - currently only ephemeral caching is supported */
  type: "ephemeral";
  /** Time-to-live for the cached content */
  ttl?: "5m" | "1h"
}

/**
 * Document content part type for Anthropic extended context with citations.
 * This is specific to Anthropic and not part of the standard OpenAI API.
 */
export interface ChatCompletionContentPartDocument {
  type: "document";
  source: {
    type: "text";
    media_type: string;
    data: string;
  };
  title?: string;
  citations?: {
    enabled: boolean;
  };
}

/**
 * OpenAI content part extended with optional cache control and document support.
 * Allows individual content parts within a message to have cache control.
 * Includes Anthropic-specific document type for extended context features.
 */
export type HeliconeChatCompletionContentPart = (ChatCompletionContentPart | ChatCompletionContentPartDocument) & {
  cache_control?: CacheControl;
};

/**
 * OpenAI message with optional cache control support
 */
type HeliconeMessageParam<T> = Omit<T, 'content'> & {
  content: string | HeliconeChatCompletionContentPart[] | null;
  cache_control?: CacheControl;
};

export type HeliconeChatCompletionMessageParam = 
  | HeliconeMessageParam<ChatCompletionDeveloperMessageParam>
  | HeliconeMessageParam<ChatCompletionSystemMessageParam>
  | HeliconeMessageParam<ChatCompletionUserMessageParam>
  | HeliconeMessageParam<ChatCompletionAssistantMessageParam>
  | HeliconeMessageParam<ChatCompletionToolMessageParam>
  | HeliconeMessageParam<ChatCompletionFunctionMessageParam>

/**
 * Non-streaming completion params with optional messages
 */
type ChatCompletionCreateParamsNonStreamingPartialMessages = Omit<ChatCompletionCreateParamsNonStreaming, 'messages'> & { 
  messages?: HeliconeChatCompletionMessageParam[] 
};

/**
 * Streaming completion params with optional messages
 */
type ChatCompletionCreateParamsStreamingPartialMessages = Omit<ChatCompletionCreateParamsStreaming, 'messages'> & { 
  messages?: HeliconeChatCompletionMessageParam[] 
};

/**
 * Parameters for using Helicone prompt templates.
 *
 * @example
 * ```typescript
 * const promptParams = {
 *   prompt_id: "XXXXXX",
 *   version_id: "5d4ec7d7-5725-46c2-ad26-41ddf6287527", // optional
 *   environment: "production", // optional - targets specific environment
 *   inputs: {
 *     name: "John",
 *     age: 20,
 *   }
 * };
 * ```
 */
export type HeliconePromptParams = {
  /** The unique identifier for your Helicone prompt template */
  prompt_id?: string;
  /** The deployment environment to target for the prompt */
  environment?: string;
  /** Optional version ID. If not provided, uses the latest version */
  version_id?: string;
  /**
   * Key-value pairs to interpolate into your prompt template.
   * Keys should match the variable names in your template.
   */
  inputs?: Record<string, any>;
};

/**
 * OpenAI ChatCompletion parameters extended with Helicone prompt template support.
 * Use this type when creating non-streaming chat completions with Helicone prompts.
 *
 * @example
 * ```typescript
 * const response = await openai.chat.completions.create({
 *   prompt_id: "123",
 *   model: "gpt-4o",
 *   messages: [
 *     // Message-level cache control (string content)
 *     {
 *       role: "user",
 *       content: "Hello!",
 *       cache_control: { type: "ephemeral", ttl: "5m" },
 *     },
 *     // Content-part-level cache control (array content, no message-level cache)
 *     {
 *       role: "user",
 *       content: [
 *         {
 *           type: "text",
 *           text: "Analyze this document",
 *           cache_control: { type: "ephemeral", ttl: "1h" },
 *         },
 *         {
 *           type: "text",
 *           text: "Additional context",
 *         },
 *       ],
 *     },
 *   ],
 *   inputs: {
 *     name: "John",
 *     age: 20,
 *   },
 * } as HeliconeChatCreateParams);
 * ```
 */
export type HeliconeChatCreateParams = ChatCompletionCreateParamsNonStreamingPartialMessages &
  HeliconePromptParams;

/**
 * OpenAI ChatCompletion parameters extended with Helicone prompt template support for streaming responses.
 * Use this type when creating streaming chat completions with Helicone prompts.
 *
 * @example
 * ```typescript
 * const stream = await openai.chat.completions.create({
 *   prompt_id: "123",
 *   model: "gpt-4o",
 *   messages: [
 *     // Content-part-level cache control only (no message-level cache allowed)
 *     {
 *       role: "user",
 *       content: [
 *         {
 *           type: "text",
 *           text: "Process this data",
 *           cache_control: { type: "ephemeral", ttl: "5m" },
 *         },
 *         {
 *           type: "text",
 *           text: "Additional data without cache",
 *         },
 *       ],
 *     },
 *   ],
 *   stream: true,
 *   inputs: {
 *     name: "John",
 *     age: 20,
 *   },
 * } as HeliconeChatCreateParamsStreaming);
 * ```
 */
export type HeliconeChatCreateParamsStreaming =
  ChatCompletionCreateParamsStreamingPartialMessages & HeliconePromptParams;

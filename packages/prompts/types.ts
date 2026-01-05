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

  // optional, just for visibility
  from_prompt_partial?: boolean;
}

export interface PromptPartialVariable {
  prompt_id: string;
  index: number;
  environment?: string;
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
 * Reasoning detail for Anthropic thinking blocks with signatures.
 * Required for multi-turn conversations with thinking enabled.
 */
export interface ReasoningDetail {
  thinking: string;
  signature: string;
}

/**
 * Image content part for image outputs in assistant messages.
 * Used when models generate images as part of their response.
 */
export interface HeliconeContentPartImage {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

/**
 * OpenAI message with optional cache control support
 */
type HeliconeMessageParam<T> = Omit<T, 'content'> & {
  content: string | HeliconeChatCompletionContentPart[] | null;
  cache_control?: CacheControl;
  reasoning?: string;
  reasoning_details?: ReasoningDetail[];
  /** Image outputs from models that support image generation (e.g., Google Gemini) */
  images?: HeliconeContentPartImage[];
};

export type HeliconeChatCompletionMessageParam = 
  | HeliconeMessageParam<ChatCompletionDeveloperMessageParam>
  | HeliconeMessageParam<ChatCompletionSystemMessageParam>
  | HeliconeMessageParam<ChatCompletionUserMessageParam>
  | HeliconeMessageParam<ChatCompletionAssistantMessageParam>
  | HeliconeMessageParam<ChatCompletionToolMessageParam>
  | HeliconeMessageParam<ChatCompletionFunctionMessageParam>

export interface HeliconeImageGenerationConfig {
  aspect_ratio: string; // e.g "16:9"
  image_size: string; // e.g "2K"
}

/**
 * Additional configuration options for Helicone chat completions.
 * These parameters extend the standard OpenAI chat completion parameters
 * with provider-specific options that may not be available in all models.
 */
export type HeliconeChatCompletionExtraConfig = {
  /**
   * Limits the number of highest probability vocabulary tokens to consider for generation.
   * Only supported by certain providers (e.g., Anthropic, Google).
   * Will be ignored by providers that don't support this parameter.
   * 
   * @example
   * ```typescript
   * const response = await openai.chat.completions.create({
   *   model: "claude-3-sonnet-20240229",
   *   top_k: 40,
   *   messages: [{ role: "user", content: "Hello!" }]
   * } as HeliconeChatCreateParams);
   * ```
   */
  top_k?: number;

  /**
   * Configuration for image generation.
   * Only supported by certain providers (e.g., Google).
   * Will be ignored by providers that don't support this parameter.
   */
  image_generation?: HeliconeImageGenerationConfig;
}

/**
 * Non-streaming completion params with optional messages
 */
type ChatCompletionCreateParamsNonStreamingPartialMessages = Omit<ChatCompletionCreateParamsNonStreaming, 'messages'> & { 
  messages?: HeliconeChatCompletionMessageParam[] 
} & HeliconeChatCompletionExtraConfig;

/**
 * Streaming completion params with optional messages
 */
type ChatCompletionCreateParamsStreamingPartialMessages = Omit<ChatCompletionCreateParamsStreaming, 'messages'> & { 
  messages?: HeliconeChatCompletionMessageParam[] 
} & HeliconeChatCompletionExtraConfig;

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
 * Reasoning options for controlling thinking/reasoning behavior.
 */
export interface HeliconeReasoningOptions {
  reasoning_options?: {
    /**
     * Token budget for thinking.
     * - For Google Gemini 2.5: Maps to thinkingConfig.thinkingBudget
     * - Use -1 for dynamic thinking
     */
    budget_tokens?: number;

    /**
     * Thinking level for Google Gemini 3+ models.
     * - "low" for faster, less detailed reasoning
     * - "high" for more detailed reasoning
     */
    thinking_level?: "low" | "high";
  };
}

/**
 * Configuration for context editing strategies.
 *
 * Context editing automatically manages conversation context as it grows,
 * optimizing costs and staying within context window limits through
 * server-side API strategies.
 *
 * Currently only supported for Anthropic models. When using with other providers,
 * the context_editing field will be stripped from the request.
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/context-editing
 */
export interface ContextEditingConfig {
  /**
   * Whether context editing is enabled.
   */
  enabled: boolean;

  /**
   * Optional strategy for clearing old tool uses when context exceeds thresholds.
   * Only applicable for Anthropic models.
   */
  clear_tool_uses?: {
    /**
     * Token threshold at which to trigger clearing (default: 100000)
     */
    trigger?: number;
    /**
     * Number of recent tool uses to preserve (default: 3)
     */
    keep?: number;
    /**
     * Minimum tokens to clear per activation
     */
    clear_at_least?: number;
    /**
     * Tool names to exclude from clearing
     */
    exclude_tools?: string[];
    /**
     * Whether to also clear tool call inputs (default: false)
     */
    clear_tool_inputs?: boolean;
  };

  /**
   * Optional strategy for clearing thinking blocks when extended thinking is enabled.
   * Only applicable for Anthropic models with thinking enabled.
   */
  clear_thinking?: {
    /**
     * Number of assistant turns with thinking to preserve, or "all" for maximum cache hits.
     * Default: 1
     */
    keep?: number | "all";
  };
}

export interface HeliconeContextEditingOptions {
  /**
   * Context editing configuration for managing conversation context.
   * Only supported for Anthropic models - will be stripped for other providers.
   */
  context_editing?: ContextEditingConfig;
}

/**
 * OpenAI ChatCompletion parameters extended with Helicone prompt template support.
 * Use this type when creating non-streaming chat completions with Helicone prompts.
 *
 * @example
 * ```typescript
 * const response = await openai.chat.completions.create({
 *   prompt_id: "123",
 *   model: "gpt-4o",
 *   
 *   // Optional: reasoning configuration for reasoning models
 *   reasoning_options: {
 *     // For Anthropic models
 *     budget_tokens: 1000,
 *     // For Google models
 *     thinking_level: "high",
 *   },
 *   
 *   // Optional: context editing for Anthropic models
 *   context_editing: {
 *     enabled: true,
 *     clear_tool_uses: {
 *       trigger: 100000,
 *       keep: 3,
 *     },
 *     clear_thinking: {
 *       keep: 1,
 *     },
 *   },
 *   
 *   // Optional: image generation config for Google models
 *   aspect_ratio: "16:9",
 *   image_size: "2K",
 *   
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
  HeliconePromptParams & HeliconeReasoningOptions & HeliconeContextEditingOptions;

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

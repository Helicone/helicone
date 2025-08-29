import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
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

// OpenAI chat completion types where messages is optional
// this is because we can generally assume that prompts contain messages themselves, and so after merging the params, the messages will be present
// and OpenAI compatible endpoints will not complain about messages being omitted.
type ChatCompletionCreateParamsNonStreamingPartialMessages = Omit<ChatCompletionCreateParamsNonStreaming, 'messages'> & Partial<Pick<ChatCompletionCreateParamsNonStreaming, 'messages'>>;
type ChatCompletionCreateParamsStreamingPartialMessages = Omit<ChatCompletionCreateParamsStreaming, 'messages'> & Partial<Pick<ChatCompletionCreateParamsStreaming, 'messages'>>;

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
  prompt_id: string;
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
 *   prompt_id: "XXXXXX",
 *   model: "gpt-4",
 *   messages: [{ role: "user", content: "Hello!" }], // optional
 *   inputs: {
 *     name: "John",
 *     age: 20,
 *   }
 * } as HeliconeChatCreateCompletion);
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
 *   prompt_id: "XXXXXX",
 *   model: "gpt-4",
 *   messages: [{ role: "user", content: "Hello!" }], // optional
 *   stream: true,
 *   inputs: {
 *     name: "John",
 *     age: 20,
 *   }
 * } as HeliconePromptChatCompletionStreaming);
 * ```
 */
export type HeliconeChatCreateParamsStreaming =
  ChatCompletionCreateParamsStreamingPartialMessages & HeliconePromptParams;

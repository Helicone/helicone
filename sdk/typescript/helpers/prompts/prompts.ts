import { ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";

/**
 * Parameters for using Helicone prompt templates.
 * 
 * @example
 * ```typescript
 * const promptParams = {
 *   prompt_id: "XXXXXX",
 *   version_id: "5d4ec7d7-5725-46c2-ad26-41ddf6287527", // optional
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
    /** Optional version ID. If not provided, uses the latest version */
    version_id?: string;
    /** 
     * Key-value pairs to interpolate into your prompt template.
     * Keys should match the variable names in your template.
     */
    inputs?: Record<string, any>;
}

/**
 * OpenAI ChatCompletion parameters extended with Helicone prompt template support.
 * Use this type when creating non-streaming chat completions with Helicone prompts.
 * 
 * @example
 * ```typescript
 * const response = await openai.chat.completions.create({
 *   prompt_id: "XXXXXX",
 *   model: "gpt-4",
 *   messages: [{ role: "user", content: "Hello!" }],
 *   inputs: {
 *     name: "John",
 *     age: 20,
 *   }
 * } as HeliconePromptChatCompletion);
 * ```
 */
export type HeliconeChatCreateParams = ChatCompletionCreateParamsNonStreaming & HeliconePromptParams;


/**
 * OpenAI ChatCompletion parameters extended with Helicone prompt template support for streaming responses.
 * Use this type when creating streaming chat completions with Helicone prompts.
 * 
 * @example
 * ```typescript
 * const stream = await openai.chat.completions.create({
 *   prompt_id: "XXXXXX",
 *   model: "gpt-4",
 *   messages: [{ role: "user", content: "Hello!" }],
 *   stream: true,
 *   inputs: {
 *     name: "John",
 *     age: 20,
 *   }
 * } as HeliconePromptChatCompletionStreaming);
 * ```
 */
export type HeliconeChatCreateParamsStreaming = ChatCompletionCreateParamsStreaming & HeliconePromptParams;
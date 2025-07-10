import { ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";

export type HeliconeInput = string | number | boolean;
export type HeliconePromptParams = {
    prompt_id: string;
    version_id?: string;
    inputs?: Record<string, HeliconeInput>;
}
export type HeliconePromptChatCompletion = ChatCompletionCreateParamsNonStreaming & HeliconePromptParams;
export type HeliconePromptChatCompletionStreaming = ChatCompletionCreateParamsStreaming & HeliconePromptParams;
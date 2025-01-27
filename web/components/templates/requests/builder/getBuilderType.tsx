import { LlmType } from "../../../../lib/api/models/requestResponseModel";
import { Provider } from "../../../../lib/api/request/request";
import { BuilderType } from "./BuilderType";

export const getBuilderType = (
  model: string,
  provider: Provider,
  path?: string | null,
  llmType?: LlmType | null,
  isAssistant?: boolean
): BuilderType => {
  if (provider === "OPENROUTER") {
    return "ChatGPTBuilder";
  }

  if (isAssistant) {
    return "OpenAIAssistantBuilder";
  }

  if (model && model.toLowerCase().includes("gemini")) {
    return "GeminiBuilder";
  }

  if (llmType === "chat") {
    return "ChatBuilder";
  }

  if (llmType === "completion") {
    return "CompletionBuilder";
  }

  if (provider === "CUSTOM") {
    return "CustomBuilder";
  }

  if (provider === "GROQ") {
    return "ChatGPTBuilder";
  }

  if (model == "black-forest-labs/FLUX.1-schnell") {
    return "FluxBuilder";
  }

  if (
    provider === "TOGETHER" ||
    (provider as any) === "TOGETHERAI" ||
    path?.includes("oai2ant") ||
    model == "gpt-4-vision-preview" ||
    model == "gpt-4-1106-vision-preview"
  ) {
    return "ChatGPTBuilder";
  }

  if (model === "dall-e-3" || model === "dall-e-2") {
    return "DalleBuilder";
  }

  // mistralai/Mistral-7B-Instruct-v[number].[number]
  if (/^mistralai\/Mistral-7B-Instruct-v\d+\.\d+$/.test(model)) {
    return "ChatBuilder";
  }

  if (
    // GPT-3 (deprecated)
    /^text-(davinci|curie|babbage|ada)(-\[\w+\]|-\d+)?$/.test(model) ||
    // InstructGPT
    /instruct$/.test(model)
  ) {
    return "GPT3Builder";
  }

  if (
    /^(ft:)?gpt-(4|3\.5|35)(-turbo)?(-\d{2}k)?(-\d{4})?/.test(model) ||
    /^o1-(preview|mini)(-\d{4}-\d{2}-\d{2})?$/.test(model)
  ) {
    return "ChatGPTBuilder";
  }

  if (/^meta-llama\/.*/i.test(model)) {
    return "ChatGPTBuilder"; // for now
  }

  if (/^text-moderation(-\[\w+\]|-\d+)?$/.test(model)) {
    return "ModerationBuilder";
  }

  if (/^text-embedding/.test(model)) {
    return "EmbeddingBuilder";
  }

  if (/^claude/.test(model)) {
    return "ChatGPTBuilder";
  }

  return "UnknownBuilder";
};

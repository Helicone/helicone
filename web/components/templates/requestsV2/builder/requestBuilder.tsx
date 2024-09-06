import { HeliconeRequest, Provider } from "../../../../lib/api/request/request";
import ClaudeBuilder from "./claudeBuilder";
import EmbeddingBuilder from "./embeddingBuilder";
import ChatGPTBuilder from "./chatGPTBuilder";
import GPT3Builder from "./GPT3Builder";
import ModerationBuilder from "./moderationBuilder";
import AbstractRequestBuilder, {
  NormalizedRequest,
} from "./abstractRequestBuilder";
import CustomBuilder from "./customBuilder";
import UnknownBuilder from "./unknownBuilder";
import CompletionBuilder from "./completionBuilder";
import { LlmType } from "../../../../lib/api/models/requestResponseModel";
import ChatBuilder from "./chatBuilder";
import { DalleBuilder } from "./dalleBuilder";
import OpenAIAssistantBuilder from "./OpenAIAssistantBuilder";

export type BuilderType =
  | "ChatBuilder"
  | "OpenAIAssistantBuilder"
  | "GeminiBuilder"
  | "CompletionBuilder"
  | "ChatGPTBuilder"
  | "GPT3Builder"
  | "ModerationBuilder"
  | "EmbeddingBuilder"
  | "ClaudeBuilder"
  | "CustomBuilder"
  | "DalleBuilder"
  | "UnknownBuilder";

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

  if (
    provider === "TOGETHER" ||
    (provider as any) === "TOGETHERAI" ||
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

  if (/^(ft:)?gpt-(4|3\.5|35)(-turbo)?(-\d{2}k)?(-\d{4})?/.test(model)) {
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
    if (path?.includes("messages")) {
      return "ChatGPTBuilder";
    } else {
      return "ClaudeBuilder";
    }
  }

  return "UnknownBuilder";
};

const builders: {
  [key in BuilderType]: new (
    request: HeliconeRequest,
    model: string
  ) => AbstractRequestBuilder;
} = {
  ChatBuilder: ChatBuilder,
  GeminiBuilder: ChatBuilder,
  CompletionBuilder: CompletionBuilder,
  ChatGPTBuilder: ChatGPTBuilder,
  GPT3Builder: GPT3Builder,
  ModerationBuilder: ModerationBuilder,
  EmbeddingBuilder: EmbeddingBuilder,
  ClaudeBuilder: ClaudeBuilder,
  CustomBuilder: CustomBuilder,
  DalleBuilder: DalleBuilder,
  UnknownBuilder: UnknownBuilder,
  OpenAIAssistantBuilder: OpenAIAssistantBuilder,
};

const getModelFromPath = (path: string) => {
  const regex1 = /\/engines\/([^/]+)/;
  const regex2 = /models\/([^/:]+)/;

  let match = path.match(regex1);

  if (!match) {
    match = path.match(regex2);
  }

  if (match && match[1]) {
    return match[1];
  } else {
    return undefined;
  }
};

const getRequestBuilder = (request: HeliconeRequest) => {
  let model =
    request.request_model || getModelFromPath(request.target_url) || "";
  console.log("isAssistantRequest", isAssistantRequest(request));
  const builderType = getBuilderType(
    model,
    request.provider,
    request.target_url,
    request.llmSchema?.request?.llm_type ?? null,
    isAssistantRequest(request)
  );
  let builder = builders[builderType];
  console.log("builderType", builderType);
  return new builder(request, model);
};

const isAssistantRequest = (request: HeliconeRequest) => {
  return (
    request.request_body.hasOwnProperty("assistant_id") ||
    request.request_body.hasOwnProperty("metadata") ||
    request.response_body.hasOwnProperty("metadata") ||
    (Array.isArray(request.response_body.data) &&
      request.response_body.data.some((item: any) =>
        item.hasOwnProperty("metadata")
      ))
  );
};

const getNormalizedRequest = (request: HeliconeRequest): NormalizedRequest => {
  try {
    return getRequestBuilder(request).build();
  } catch (error) {
    return getRequestBuilder(request).build();
  }
};

export default getNormalizedRequest;

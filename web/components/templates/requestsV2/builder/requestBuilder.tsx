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

export type BuilderType =
  | "ChatBuilder"
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
  llmType?: LlmType | null
): BuilderType => {
  if (llmType === "chat") {
    return "ChatBuilder";
  }

  if (llmType === "completion") {
    return "CompletionBuilder";
  }

  if (provider === "CUSTOM") {
    return "CustomBuilder";
  }

  if (model == "gpt-4-vision-preview" || model == "gpt-4-1106-vision-preview") {
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

  if (
    /^meta-llama\/Llama-2-13b-chat-hf:transcript_summarizer:64cB1r3/.test(model)
  ) {
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
  CompletionBuilder: CompletionBuilder,
  ChatGPTBuilder: ChatGPTBuilder,
  GPT3Builder: GPT3Builder,
  ModerationBuilder: ModerationBuilder,
  EmbeddingBuilder: EmbeddingBuilder,
  ClaudeBuilder: ClaudeBuilder,
  CustomBuilder: CustomBuilder,
  DalleBuilder: DalleBuilder,
  UnknownBuilder: UnknownBuilder,
};

const getModelFromPath = (path: string) => {
  let regex = /\/engines\/([^\/]+)/;
  let match = path.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return undefined;
  }
};

const getRequestBuilder = (request: HeliconeRequest, useRosetta: boolean) => {
  let model =
    request.response_body?.model ||
    request.request_body?.model ||
    request.response_body?.body?.model || // anthropic
    getModelFromPath(request.request_path) ||
    "";
  const builderType = getBuilderType(
    model,
    request.provider,
    request.request_path,
    useRosetta ? request.llmSchema?.request?.llm_type ?? null : null
  );
  let builder = builders[builderType];
  return new builder(request, model);
};

const getNormalizedRequest = (request: HeliconeRequest): NormalizedRequest => {
  try {
    return getRequestBuilder(request, true).build();
  } catch (error) {
    return getRequestBuilder(request, false).build();
  }
};

export default getNormalizedRequest;

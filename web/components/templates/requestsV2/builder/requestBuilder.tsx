import { HeliconeRequest, Provider } from "../../../../lib/api/request/request";
import ClaudeBuilder from "./claudeBuilder";
import EmbeddingBuilder from "./embeddingBuilder";
import ChatGPTBuilder from "./chatGPTBuilder";
import GPT3Builder from "./GPT3Builder";
import ModerationBuilder from "./moderationBuilder";
import AbstractRequestBuilder from "./abstractRequestBuilder";
import CustomBuilder from "./customBuilder";

export type BuilderType =
  | "ChatGPTBuilder"
  | "GPT3Builder"
  | "ModerationBuilder"
  | "EmbeddingBuilder"
  | "ClaudeBuilder"
  | "CustomBuilder";

export const getBuilderType = (
  model: string,
  provider: Provider
): BuilderType => {
  if (provider === "CUSTOM") {
    return "CustomBuilder";
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

  if (/^text-moderation(-\[\w+\]|-\d+)?$/.test(model)) {
    return "ModerationBuilder";
  }

  if (/^text-embedding/.test(model)) {
    return "EmbeddingBuilder";
  }

  if (/^claude/.test(model)) {
    return "ClaudeBuilder";
  }

  return "GPT3Builder";
};

const builders: {
  [key in BuilderType]: new (
    request: HeliconeRequest,
    model: string
  ) => AbstractRequestBuilder;
} = {
  ChatGPTBuilder: ChatGPTBuilder,
  GPT3Builder: GPT3Builder,
  ModerationBuilder: ModerationBuilder,
  EmbeddingBuilder: EmbeddingBuilder,
  ClaudeBuilder: ClaudeBuilder,
  CustomBuilder: CustomBuilder,
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

const getRequestBuilder = (request: HeliconeRequest) => {
  let model =
    request.response_body?.model ||
    request.request_body?.model ||
    request.response_body?.body?.model || // anthropic
    getModelFromPath(request.request_path) ||
    "";
  const builderType = getBuilderType(model, request.provider);
  let builder = builders[builderType];
  return new builder(request, model);
};

export default getRequestBuilder;

import { HeliconeRequest } from "../../../../lib/api/request/request";
import EmbeddingBuilder from "./embeddingBuilder";
import FunctionGPTBuilder from "./functionGPTBuilder";
import GPT3Builder from "./GPT3Builder";
import ModerationBuilder from "./moderationBuilder";

export type BuilderType =
  | "FunctionGPTBuilder"
  | "GPT3Builder"
  | "ModerationBuilder"
  | "EmbeddingBuilder";

export const getBuilderType = (model: string): BuilderType => {
  if (/^(gpt-4|gpt-3\.5)/.test(model)) {
    return "FunctionGPTBuilder";
  }

  if (/^text-(davinci|curie|babbage|ada)(-\[\w+\]|-\d+)?$/.test(model)) {
    return "GPT3Builder";
  }

  if (/^text-moderation(-\[\w+\]|-\d+)?$/.test(model)) {
    return "ModerationBuilder";
  }

  if (/^text-embedding/.test(model)) {
    return "EmbeddingBuilder";
  }

  return "GPT3Builder";
};

let builders = {
  FunctionGPTBuilder: FunctionGPTBuilder,
  GPT3Builder: GPT3Builder,
  ModerationBuilder: ModerationBuilder,
  EmbeddingBuilder: EmbeddingBuilder,
};

const getRequestBuilder = (request: HeliconeRequest) => {
  let requestModel =
    request.request_body.model || request.response_body.model || "";
  const builderType = getBuilderType(requestModel);
  let builder = builders[builderType];
  return new builder(request);
};

export default getRequestBuilder;

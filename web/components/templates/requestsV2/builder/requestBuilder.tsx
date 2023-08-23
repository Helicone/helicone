import { HeliconeRequest } from "../../../../lib/api/request/request";
import ClaudeBuilder from "./claudeBuilder";
import EmbeddingBuilder from "./embeddingBuilder";
import FunctionGPTBuilder from "./functionGPTBuilder";
import GPT3Builder from "./GPT3Builder";
import ModerationBuilder from "./moderationBuilder";

export type BuilderType =
  | "FunctionGPTBuilder"
  | "GPT3Builder"
  | "ModerationBuilder"
  | "EmbeddingBuilder"
  | "ClaudeBuilder";

export const getBuilderType = (model: string): BuilderType => {
  if (/^gpt-(4|3\.5|35)/.test(model)) {
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

  if (/^claude/.test(model)) {
    return "ClaudeBuilder";
  }

  return "GPT3Builder";
};

let builders = {
  FunctionGPTBuilder: FunctionGPTBuilder,
  GPT3Builder: GPT3Builder,
  ModerationBuilder: ModerationBuilder,
  EmbeddingBuilder: EmbeddingBuilder,
  ClaudeBuilder: ClaudeBuilder,
};

const getModelFromPath = (path: string) => {
  let regex = /\/engines\/([^\/]+)/;
  let match = path.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    console.log("No match found");
    return undefined;
  }
};

const getRequestBuilder = (request: HeliconeRequest) => {
  let requestModel =
    request.response_body?.model ||
    request.request_body?.model ||
    request.response_body?.body?.model || // anthropic
    getModelFromPath(request.request_path) ||
    "";
  const builderType = getBuilderType(requestModel);
  let builder = builders[builderType];
  return new builder(request, requestModel);
};

export default getRequestBuilder;

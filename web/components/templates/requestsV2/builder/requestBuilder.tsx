import { HeliconeRequest } from "../../../../lib/api/request/request";
import AbstractRequestBuilder from "./abstractRequestBuilder";
import ChatGPTBuilder from "./ChatGPTBuilder";
import FunctionGPTBuilder from "./functionGPTBuilder";
import GPT3Builder from "./GPT3Builder";
import ModerationBuilder from "./moderationBuilder";

type BuilderType =
  | "FunctionGPTBuilder"
  | "ChatGPTBuilder"
  | "GPT3Builder"
  | "ModerationBuilder";

const getBuilderType = (model: string): BuilderType => {
  if (/^(gpt-4|gpt-3\.5-turbo)-(0613|32k-0613|16k-0613)/.test(model)) {
    return "FunctionGPTBuilder";
  }

  if (/^(gpt-4|gpt-3\.5-turbo)(|-32k|-16k)$/.test(model)) {
    return "ChatGPTBuilder";
  }

  if (/^text-(davinci|curie|babbage|ada)(-\[\w+\]|-\d+)?$/.test(model)) {
    return "GPT3Builder";
  }

  if (/^text-moderation(-\[\w+\]|-\d+)?$/.test(model)) {
    return "ModerationBuilder";
  }

  return "GPT3Builder";
};

let builders = {
  FunctionGPTBuilder: FunctionGPTBuilder,
  ChatGPTBuilder: ChatGPTBuilder,
  GPT3Builder: GPT3Builder,
  ModerationBuilder: ModerationBuilder,
};

const getRequestBuilder = (request: HeliconeRequest) => {
  let requestModel = request.request_body.model || request.response_body.model;
  const builderType = getBuilderType(requestModel);
  let builder = builders[builderType];
  return new builder(request);
};

export default getRequestBuilder;

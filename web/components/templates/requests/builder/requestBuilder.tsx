import { HeliconeRequest } from "../../../../lib/api/request/request";
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
import ChatBuilder from "./chatBuilder";
import { DalleBuilder } from "./dalleBuilder";
import OpenAIAssistantBuilder from "./OpenAIAssistantBuilder";
import { FluxBuilder } from "./fluxBuilder";
import { getBuilderType } from "./getBuilderType";
import { BuilderType } from "./BuilderType";

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
  FluxBuilder: FluxBuilder,
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
  const builderType = getBuilderType(
    model,
    request.provider,
    request.target_url,
    request.llmSchema?.request?.llm_type ?? null,
    isAssistantRequest(request)
  );
  let builder = builders[builderType];
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

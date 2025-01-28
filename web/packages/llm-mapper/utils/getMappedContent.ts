import { HeliconeRequest } from "../types";
import { mapAnthropicRequest } from "../mappers/anthropic/chat";
import { mapGeminiPro } from "../mappers/gemini/chat";
import { mapOpenAIRequest } from "../mappers/openai/chat";
import { mapDalleRequest } from "../mappers/openai/dalle";
import { mapOpenAIInstructRequest } from "../mappers/openai/instruct";
import { mapOpenAIEmbedding } from "../mappers/openai/embedding";

import { getMapperTypeFromHeliconeRequest } from "./getMapperType";
import { MappedLLMRequest, MapperType } from "../types";
import { modelCost } from "../../cost/costCalc";
import { MapperFn } from "../mappers/types";

const MAPPERS: Record<MapperType, MapperFn<any, any>> = {
  "openai-chat": mapOpenAIRequest,
  "anthropic-chat": mapAnthropicRequest,
  "gemini-chat": mapGeminiPro,
  "black-forest-labs-image": mapOpenAIRequest,
  "openai-assistant": mapOpenAIRequest,
  "openai-image": mapDalleRequest,
  "openai-moderation": mapOpenAIRequest,
  "openai-embedding": mapOpenAIEmbedding,
  "openai-instruct": mapOpenAIInstructRequest,
  unknown: mapOpenAIRequest,
} satisfies Record<MapperType, MapperFn<any, any>>;

const getStatusType = (
  heliconeRequest: HeliconeRequest
): MappedLLMRequest["heliconeMetadata"]["status"]["statusType"] => {
  if (heliconeRequest.response_body?.error?.message) {
    return "error";
  }
  switch (heliconeRequest.response_status) {
    case 200:
      return "success";
    case 0:
    case null:
      return "pending";
    default:
      return "error";
  }
};

const metaDataFromHeliconeRequest = (
  heliconeRequest: HeliconeRequest,
  model: string
): MappedLLMRequest["heliconeMetadata"] => {
  return {
    requestId: heliconeRequest.request_id,
    countryCode: heliconeRequest.country_code,
    cost: modelCost({
      model: model,
      sum_completion_tokens: heliconeRequest.completion_tokens || 0,
      sum_prompt_tokens: heliconeRequest.prompt_tokens || 0,
      sum_tokens: heliconeRequest.total_tokens || 0,
      provider: heliconeRequest.provider,
    }),
    createdAt: heliconeRequest.request_created_at,
    path: heliconeRequest.request_path,
    completionTokens: heliconeRequest.completion_tokens,
    promptTokens: heliconeRequest.prompt_tokens,
    totalTokens: heliconeRequest.total_tokens,
    latency: heliconeRequest.delay_ms,
    user: heliconeRequest.request_user_id,
    customProperties: heliconeRequest.request_properties,
    status: {
      statusType: getStatusType(heliconeRequest),
      code: heliconeRequest.response_status,
    },
    feedback: {
      createdAt: heliconeRequest.feedback_created_at ?? null,
      id: heliconeRequest.feedback_id ?? null,
      rating: heliconeRequest.feedback_rating ?? null,
    },
    provider: heliconeRequest.provider,
    timeToFirstToken: heliconeRequest.time_to_first_token,
    scores: heliconeRequest.scores,
  };
};

export const getMappedContent = ({
  mapperType,
  heliconeRequest,
}: {
  mapperType: MapperType;
  heliconeRequest: HeliconeRequest;
}): MappedLLMRequest => {
  const mapper = MAPPERS[mapperType];
  if (!mapper) {
    throw new Error(`Mapper not found: ${JSON.stringify(mapperType)}`);
  }
  const result = mapper({
    request: heliconeRequest.request_body,
    response: heliconeRequest.response_body,
    statusCode: heliconeRequest.response_status,
    model: heliconeRequest.model,
  });

  return {
    _type: mapperType,
    ...result,
    model: heliconeRequest.model,
    id: heliconeRequest.request_id,
    raw: {
      request: heliconeRequest.request_body,
      response: heliconeRequest.response_body,
    },
    heliconeMetadata: metaDataFromHeliconeRequest(
      heliconeRequest,
      heliconeRequest.model
    ),
  };
};

export const heliconeRequestToMappedContent = (
  heliconeRequest: HeliconeRequest
): MappedLLMRequest => {
  const mapperType = getMapperTypeFromHeliconeRequest(
    heliconeRequest,
    heliconeRequest.model
  );
  return getMappedContent({
    mapperType,
    heliconeRequest,
  });
};

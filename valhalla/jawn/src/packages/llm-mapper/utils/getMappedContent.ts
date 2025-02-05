import { mapAnthropicRequest } from "../mappers/anthropic/chat";
import { mapGeminiPro } from "../mappers/gemini/chat";
import { mapOpenAIRequest } from "../mappers/openai/chat";
import { mapDalleRequest } from "../mappers/openai/dalle";
import { mapOpenAIEmbedding } from "../mappers/openai/embedding";
import { mapOpenAIInstructRequest } from "../mappers/openai/instruct";
import {
  HeliconeRequest,
  Message,
  MappedLLMRequest,
  MapperType,
} from "../types";

import { modelCost } from "../../cost/costCalc";
import { mapBlackForestLabsImage } from "../mappers/black-forest-labs/image";
import { mapOpenAIAssistant } from "../mappers/openai/assistant";
import { mapOpenAIModeration } from "../mappers/openai/moderation";
import { MapperFn } from "../mappers/types";
import { getMapperTypeFromHeliconeRequest } from "./getMapperType";
import { mapVectorDB } from "../mappers/vector-db";
import { mapTool } from "../mappers/tool";

const MAPPERS: Record<MapperType, MapperFn<any, any>> = {
  "openai-chat": mapOpenAIRequest,
  "anthropic-chat": mapAnthropicRequest,
  "gemini-chat": mapGeminiPro,
  "black-forest-labs-image": mapBlackForestLabsImage,
  "openai-assistant": mapOpenAIAssistant,
  "openai-image": mapDalleRequest,
  "openai-moderation": mapOpenAIModeration,
  "openai-embedding": mapOpenAIEmbedding,
  "openai-instruct": mapOpenAIInstructRequest,
  "vector-db": mapVectorDB,
  tool: mapTool,
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

const getUnsanitizedMappedContent = ({
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
  let result: ReturnType<MapperFn<any, any>>;
  try {
    result = mapper({
      request: heliconeRequest.request_body,
      response: heliconeRequest.response_body,
      statusCode: heliconeRequest.response_status,
      model: heliconeRequest.model,
    });
  } catch (e) {
    result = {
      preview: {
        concatenatedMessages: [],
        request: JSON.stringify(heliconeRequest.request_body),
        response: JSON.stringify(heliconeRequest.response_body),
      },
      schema: {
        request: {
          prompt: `Error: ${(e as Error).message}`,
        },
      },
    };
  }

  return {
    _type: mapperType,
    preview: result.preview,
    schema: result.schema,
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

const sanitizeMappedContent = (
  mappedContent: MappedLLMRequest
): MappedLLMRequest => {
  const sanitizeMessage = (message: Message): Message => ({
    ...message,
    content:
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content),
  });

  const sanitizeMessages = (
    messages: Message[] | undefined | null
  ): Message[] | undefined | null => {
    return messages?.map(sanitizeMessage);
  };

  return {
    _type: mappedContent._type,
    id: mappedContent.id,
    schema: {
      request: {
        ...mappedContent.schema.request,
        messages: sanitizeMessages(mappedContent.schema.request.messages),
      },
      response: mappedContent.schema.response && {
        ...mappedContent.schema.response,
        messages: sanitizeMessages(mappedContent.schema.response.messages),
      },
    },
    preview: {
      ...mappedContent.preview,
      concatenatedMessages:
        sanitizeMessages(mappedContent.preview.concatenatedMessages) ?? [],
    },
    model: mappedContent.model,
    raw: mappedContent.raw,
    heliconeMetadata: mappedContent.heliconeMetadata,
  };
};

export const getMappedContent = ({
  mapperType,
  heliconeRequest,
}: {
  mapperType: MapperType;
  heliconeRequest: HeliconeRequest;
}): MappedLLMRequest => {
  const unsanitized = getUnsanitizedMappedContent({
    mapperType,
    heliconeRequest,
  });
  return sanitizeMappedContent(unsanitized);
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

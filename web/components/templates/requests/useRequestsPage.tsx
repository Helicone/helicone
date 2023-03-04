import { useGetPromptValues } from "../../../services/hooks/promptValues";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetRequests } from "../../../services/hooks/requests";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { Json } from "../../../supabase/database.types";

export type RequestWrapper = {
  isCached: boolean;
  promptName: string;
  promptRegex: string;
  requestCreatedAt: string;
  formattedPromptId: string;
  id: string;
  path: string;
  promptValues: {
    [key: string]: Json;
  } | null;
  customProperties: {
    [key: string]: Json;
  } | null;
  userId: string;
  responseCreatedAt: string;
  responseId: string;
  userApiKeyHash: string;
  userApiKeyPreview: string;
  userApiKeyUserId: string;
  latency: number;
  gpt3:
    | {
        requestBody: {
          maxTokens: number;
          model: string;
          prompt: string;
          temperature: number;
        };
        responseBody: {
          choices: {
            finishReason: string;
            index: number;
            logProbs: null; // ???
            text: string;
          }[];
          created: number;
          id: string;
          model: string;
          object: string;
          usage: {
            completionTokens: number;
            promptTokens: number;
            totalTokens: number;
          };
        };
      }
    | undefined;
  chat:
    | {
        requestBody: {
          maxTokens: number;
          model: string;
          messages: {
            content: string;
            role: string;
          }[];
          temperature: number;
        };
        responseBody: {
          choices: {
            finishReason: string;
            index: number;
            message: {
              content: string;
              role: string;
            };
          }[];
          created: number;
          id: string;
          model: string;
          object: string;
          usage: {
            completionTokens: number;
            promptTokens: number;
            totalTokens: number;
          };
        };
      }
    | undefined;
};

const useRequestsPage = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter?: FilterNode
) => {
  const {
    requests,
    count,
    from,
    to,
    isLoading: isRequestsLoading,
    refetch,
    isRefetching,
  } = useGetRequests(currentPage, currentPageSize, advancedFilter);

  const { properties, isLoading: isPropertiesLoading } = useGetProperties();

  const { values, isLoading: isValuesLoading } = useGetPromptValues();

  const isLoading =
    isRequestsLoading || isPropertiesLoading || isValuesLoading || isRefetching;

  const wrappedRequests: RequestWrapper[] = requests.map((request) => {
    const latency =
      (new Date(request.response_created_at!).getTime() -
        new Date(request.request_created_at!).getTime()) /
      1000;

    const obj: RequestWrapper = {
      isCached: request.is_cached,
      promptName: request.prompt_name || "n/a",
      promptRegex: request.prompt_regex || "n/a",
      requestCreatedAt: request.request_created_at,
      formattedPromptId: request.request_formatted_prompt_id || "n/a",
      id: request.request_id,
      path: request.request_path,
      promptValues: request.request_prompt_values,
      customProperties: request.request_properties,
      userId: request.request_user_id || "n/a",
      responseCreatedAt: request.response_created_at,
      responseId: request.response_id,
      userApiKeyHash: request.user_api_key_hash,
      userApiKeyPreview: request.user_api_key_preview,
      userApiKeyUserId: request.user_api_key_user_id,

      // More information about the request
      latency,
      chat: undefined,
      gpt3: undefined,
    };

    // check to see what type of request this is and populate the corresponding fields
    if (request.request_path?.includes("/chat/")) {
      obj.chat = {
        requestBody: {
          maxTokens: request.request_body.max_tokens,
          model: request.request_body.model,
          messages: request.request_body.messages,
          temperature: request.request_body.temperature,
        },
        responseBody: {
          choices: request.response_body.choices,
          created: request.response_body.created,
          id: request.response_body.id,
          model: request.response_body.model,
          object: request.response_body.object,
          usage: {
            completionTokens: request.response_body.usage_completion_tokens,
            promptTokens: request.response_body.usage_prompt_tokens,
            totalTokens: request.response_body.usage_total_tokens,
          },
        },
      };
    } else {
      obj.gpt3 = {
        requestBody: {
          maxTokens: request.request_body.max_tokens,
          model: request.request_body.model,
          prompt: request.request_body.prompt,
          temperature: request.request_body.temperature,
        },
        responseBody: {
          choices: request.response_body.choices,
          created: request.response_body.created,
          id: request.response_body.id,
          model: request.response_body.model,
          object: request.response_body.object,
          usage: {
            completionTokens: request.response_body.usage_completion_tokens,
            promptTokens: request.response_body.usage_prompt_tokens,
            totalTokens: request.response_body.usage_total_tokens,
          },
        },
      };
    }

    return obj;
  });

  console.log(wrappedRequests);

  return {
    requests,
    count,
    from,
    to,
    isLoading,
    refetch,
    properties,
    values,
  };
};

export default useRequestsPage;

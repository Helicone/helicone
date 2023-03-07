import { useGetPromptValues } from "../../../services/hooks/promptValues";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetRequests } from "../../../services/hooks/requests";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { Json } from "../../../supabase/database.types";
import { Message } from "./requestsPage";

export interface RequestWrapper {
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

  // these next columns need to be double-defined because of the way the table is built
  error:
    | {
        [key: string]: Json;
      }
    | undefined;
  api: {
    chat?: {
      request: Message[] | null;
      response: Message | null;
    };
    gpt3?: {
      request: string | undefined;
      response: string | undefined;
    };
  };
  latency: number;
  totalTokens: number;
  requestModel: string;
  requestText: string; // either the GPT3 prompt or the last message from the ChatGPT API
  responseText: string; // either the GPT3 response or the last message from the ChatGPT API
  logProbs: number[] | null;
  [key: string]:
    | Json
    | undefined
    | number
    | null
    | boolean
    | {
        chat?:
          | {
              request: Message[] | null;
              response: Message | null;
            }
          | undefined;
        gpt3?:
          | {
              request: string | undefined;
              response: string | undefined;
            }
          | undefined;
      };

  // gpt3?: {
  //   requestBody: {
  //     maxTokens: number;
  //     model: string;
  //     prompt: string;
  //     temperature: number;
  //   };
  //   responseBody: {
  //     choices: {
  //       finishReason: string;
  //       index: number;
  //       logProbs: {
  //         tokens: string[];
  //         tokenLogProbs: number[];
  //         topLogProbs: {
  //           [key: string]: number;
  //         }[];
  //       } | null;
  //       text: string;
  //     }[];
  //     created: number;
  //     id: string;
  //     model: string;
  //     object: string;
  //     usage: {
  //       completionTokens: number;
  //       promptTokens: number;
  //       totalTokens: number;
  //     };
  //   };
  // };

  // chat?: {
  //   requestBody: {
  //     maxTokens: number;
  //     model: string;
  //     messages: {
  //       content: string;
  //       role: string;
  //     }[];
  //     temperature: number;
  //   };
  //   responseBody: {
  //     choices: {
  //       finishReason: string;
  //       index: number;
  //       message: {
  //         content: string;
  //         role: string;
  //       };
  //     }[];
  //     created: number;
  //     id: string;
  //     model: string;
  //     object: string;
  //     usage: {
  //       completionTokens: number;
  //       promptTokens: number;
  //       totalTokens: number;
  //     };
  //   };
  // };
}

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
      api:
        request.request_body.model === "gpt-3.5-turbo" ||
        request.request_path?.includes("/chat/")
          ? {
              chat: {
                request: request.request_body.messages,
                response: request.response_body.choices?.[0]?.message,
              },
            }
          : {
              gpt3: {
                request: request.request_body.prompt,
                response: request.response_body.choices?.[0]?.text,
              },
            },
      error: request.response_body.error || undefined,
      latency,
      totalTokens: request.response_body.usage_total_tokens || 0,
      requestModel: request.request_body.model || "n/a",
      requestText:
        request.request_body.messages?.at(-1) ||
        request.request_body.prompt ||
        "n/a",
      responseText:
        (request.response_body.error?.message &&
          `error: ${request.response_body.error?.message}`) ||
        request.response_body.choices?.[0]?.text ||
        request.response_body.choices?.[0]?.message.content ||
        "n/a",
      logProbs:
        request.response_body.choices?.[0]?.logProbs?.tokenLogProbs || "n/a",
    };

    // add the custom properties to the object
    if (request.request_properties) {
      for (const property in request.request_properties) {
        if (request.request_properties.hasOwnProperty(property)) {
          const value = request.request_properties[property];
          obj[property] = value;
        }
      }
    }

    // TODO: handle the values

    // check to see what type of request this is and populate the corresponding fields
    if (
      request.request_body.model === "gpt-3.5-turbo" ||
      request.request_path?.includes("/chat/")
    ) {
      obj.chat = {
        requestBody: {
          maxTokens: request.request_body.max_tokens || 0,
          model: request.request_body.model || "n/a",
          messages: request.request_body.messages || [],
          temperature: request.request_body.temperature || 0,
        },
        responseBody: {
          choices: request.response_body.choices || [],
          created: request.response_body.created || 0,
          id: request.response_body.id || "n/a",
          model: request.response_body.model || "n/a",
          object: request.response_body.object || "n/a",
          usage: {
            completionTokens:
              request.response_body.usage_completion_tokens || 0,
            promptTokens: request.response_body.usage_prompt_tokens || 0,
            totalTokens: request.response_body.usage_total_tokens || 0,
          },
        },
      };
    } else {
      obj.gpt3 = {
        requestBody: {
          maxTokens: request.request_body.max_tokens || 0,
          model: request.request_body.model || "n/a",
          prompt: request.request_body.prompt || "n/a",
          temperature: request.request_body.temperature || 0,
        },
        responseBody: {
          choices: request.response_body.choices || [],
          created: request.response_body.created || 0,
          id: request.response_body.id || "n/a",
          model: request.response_body.model || "n/a",
          object: request.response_body.object || "n/a",
          usage: {
            completionTokens:
              request.response_body.usage_completion_tokens || 0,
            promptTokens: request.response_body.usage_prompt_tokens || 0,
            totalTokens: request.response_body.usage_total_tokens || 0,
          },
        },
      };
    }

    return obj;
  });

  console.log(wrappedRequests);

  return {
    requests: wrappedRequests,
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

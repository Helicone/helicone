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
  model: string;
  requestText: string; // either the GPT3 prompt or the last message from the ChatGPT API
  responseText: string; // either the GPT3 response or the last message from the ChatGPT API
  logProbs: number | null;
  [key: string]:
    | Json
    | undefined
    | number
    | null
    | string
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

  const getLogProbs = (logProbs: number[]) => {
    const sum = logProbs.reduce((total: any, num: any) => total + num);
    return sum;
  };

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
      totalTokens: request.response_body.usage?.total_tokens || 0,
      model: request.response_body.model || "n/a",
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
      logProbs: request.response_body.choices?.[0]?.logprobs?.token_logprobs
        ? getLogProbs(
            request.response_body.choices?.[0]?.logprobs?.token_logprobs
          )
        : null,
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
    return obj;
  });

  console.log("requests");
  console.log(requests);
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

import { HeliconeRequest } from "../../../lib/api/request/request";
import { useDebounce } from "../../../services/hooks/debounce";
import { useGetPromptValues } from "../../../services/hooks/promptValues";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetPropertyParams } from "../../../services/hooks/propertyParams";
import { useGetRequests } from "../../../services/hooks/requests";
import { useGetValueParams } from "../../../services/hooks/valueParams";
import {
  filterListToTree,
  FilterNode,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import {
  getPropertyFilters,
  getValueFilters,
  requestTableFilters,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { Json } from "../../../supabase/database.types";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { Message } from "./requestsPage";

export type RequestWrapper = {
  cacheCount: number;
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
  keyName: string;
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
    moderation?: {
      request: string | undefined;
      results: {
        [key: string]: Json;
      }[];
    };
  };
  latency: number;
  totalTokens: number;
  model: string;
  requestText: string; // either the GPT3 prompt or the last message from the ChatGPT API
  responseText: string; // either the GPT3 response or the last message from the ChatGPT API
  logProbs: number | null;
  probability: number | null;
  requestBody: Json;
  responseBody: Json;
  [key: string]:
    | Json
    | undefined
    | number
    | null
    | string
    | boolean
    | {
        chat?: {
          request: Message[] | null;
          response: Message | null;
        };
        gpt3?: {
          request: string | undefined;
          response: string | undefined;
        };
        moderation?: {
          request: string | undefined;
          results: {
            [key: string]: Json;
          }[];
        };
      };
};

const useRequestsPage = (
  currentPage: number,
  currentPageSize: number,
  iuFilterIdxs: UIFilterRow[],
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest
) => {
  const { properties, isLoading: isPropertiesLoading } = useGetProperties();
  const { values, isLoading: isValuesLoading } = useGetPromptValues();
  const { propertyParams } = useGetPropertyParams();
  const { valueParams } = useGetValueParams();

  const filterMap = (requestTableFilters as SingleFilterDef<any>[])
    .concat(
      getPropertyFilters(
        properties,
        propertyParams.map((p) => ({
          param: p.property_param,
          key: p.property_key,
        }))
      )
    )
    .concat(
      getValueFilters(
        values,
        valueParams.map((v) => ({
          param: v.value_param,
          key: v.value_key,
        }))
      )
    );
  const filter: FilterNode = {
    left: filterListToTree(
      filterUIToFilterLeafs(filterMap, iuFilterIdxs),
      "and"
    ),
    right: advancedFilter,
    operator: "and",
  };

  const {
    requests,
    count,
    from,
    to,
    isLoading: isRequestsLoading,
    refetch,
    isRefetching,
  } = useGetRequests(currentPage, currentPageSize, filter, sortLeaf);

  const isLoading =
    isRequestsLoading || isPropertiesLoading || isValuesLoading || isRefetching;

  const getLogProbs = (logProbs: number[]) => {
    const sum = logProbs.reduce((total: any, num: any) => total + num);
    return sum;
  };

  const getRequestAndResponse = (request: HeliconeRequest) => {
    if (
      request.request_path?.includes("/chat/") ||
      request.request_body.model === "gpt-3.5-turbo"
    ) {
      return {
        chat: {
          request: request.request_body.messages,
          response: request.response_body.choices?.[0]?.message,
        },
      };
    } else if (request.request_path?.includes("/moderations")) {
      return {
        moderation: {
          request: request.request_body.input,
          results: request.response_body.results,
        },
      };
    } else {
      return {
        gpt3: {
          request: request.request_body.prompt,
          response: request.response_body.choices?.[0]?.text,
        },
      };
    }
  };

  const wrappedRequests: RequestWrapper[] = requests.map((request) => {
    const latency =
      (request.delay_ms ??
        new Date(request.response_created_at!).getTime() -
          new Date(request.request_created_at!).getTime()) / 1000;

    const logProbs = request.response_body.choices?.[0]?.logprobs
      ?.token_logprobs
      ? getLogProbs(
          request.response_body.choices?.[0]?.logprobs?.token_logprobs
        )
      : null;

    const obj: RequestWrapper = {
      requestBody: request.request_body,
      responseBody: request.response_body,
      cacheCount: +request.cache_count,
      promptName: request.prompt_name || "",
      promptRegex: request.prompt_regex || "",
      requestCreatedAt: request.request_created_at,
      formattedPromptId: request.request_formatted_prompt_id || "",
      id: request.request_id,
      path: request.request_path,
      promptValues: request.request_prompt_values,
      customProperties: request.request_properties,
      userId: request.request_user_id || "",
      responseCreatedAt: request.response_created_at,
      responseId: request.response_id,
      keyName: request.key_name,
      userApiKeyHash: request.user_api_key_hash,
      userApiKeyPreview: request.user_api_key_preview,
      userApiKeyUserId: request.user_api_key_user_id,

      // More information about the request
      api: getRequestAndResponse(request),
      error: request.response_body.error || undefined,
      latency,
      totalTokens: request.response_body.usage?.total_tokens || 0,
      model: request.request_body.model || request.response_body.model || "",
      requestText:
        request.request_body.messages?.at(-1) ||
        request.request_body.input ||
        request.request_body.prompt ||
        "",
      responseText:
        (request.response_body.error?.message &&
          `error: ${request.response_body.error?.message}`) ||
        request.response_body.choices?.[0]?.text ||
        request.response_body.choices?.[0]?.message?.content ||
        JSON.stringify(request.response_body.results?.[0], null, 2) ||
        "",
      logProbs: logProbs,
      probability: logProbs ? Math.exp(logProbs) : null,
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

    // add the values to the object
    if (obj.promptValues) {
      for (const key of values) {
        if (obj.promptValues.hasOwnProperty(key)) {
          const value = obj.promptValues[key];
          obj[key] = value;
        }
      }
    }

    return obj;
  });

  return {
    requests: wrappedRequests,
    count,
    from,
    to,
    isPropertiesLoading,
    isValuesLoading,
    isLoading,
    filterMap,
    refetch,
    properties,
    values,
  };
};

export default useRequestsPage;

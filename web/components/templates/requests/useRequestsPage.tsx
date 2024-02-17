import { HeliconeRequest } from "../../../lib/api/request/request";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetFeedback } from "../../../services/hooks/feedback";
import { useGetRequests } from "../../../services/hooks/requests";
import {
  filterListToTree,
  FilterNode,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import {
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { Json } from "../../../supabase/database.types";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { Message } from "./chat";

export type PromptResponsePair =
  | {
      chat: {
        request: Message[] | null;
        response: Message | null;
      };
    }
  | {
      completion: {
        request: string | undefined;
        response: string | undefined;
      };
    }
  | {
      moderation: {
        request: string | undefined;
        results: {
          [key: string]: Json;
        }[];
      };
    };
export type RequestWrapper = {
  promptName: string;
  promptRegex: string;
  requestCreatedAt: string;
  id: string;
  path: string;
  customProperties: {
    [key: string]: Json;
  } | null;
  feedback: {
    [key: string]: Json;
  } | null;
  userId: string;
  responseCreatedAt: string;
  responseId: string;
  keyName: string;
  // these next columns need to be double-defined because of the way the table is built
  error:
    | {
        [key: string]: Json;
      }
    | undefined;
  api: PromptResponsePair;
  latency: number;
  totalTokens: number;
  completionTokens: number;
  promptTokens: number;
  model: string;
  requestText: string; // either the GPT3 prompt or the last message from the ChatGPT API
  responseText: string; // either the GPT3 response or the last message from the ChatGPT API
  logProbs: number | null;
  probability: number | null;
  requestBody: Json;
  responseBody: Json;
  status: number;
  [key: string]:
    | Json
    | undefined
    | number
    | null
    | string
    | boolean
    | PromptResponsePair;
};

const getRequestAndResponse = (
  request: HeliconeRequest
): RequestWrapper["api"] => {
  if (request.provider === "ANTHROPIC") {
    return {
      completion: {
        request: request.request_body.prompt,
        response: request.response_body?.completion,
      },
    };
  } else if (
    request.request_path?.includes("/chat/") ||
    request.request_body.model === "gpt-3.5-turbo" ||
    request.request_body?.messages
  ) {
    return {
      chat: {
        request: request.request_body.messages,
        response: request.response_body?.choices?.[0]?.message,
      },
    };
  } else if (request.request_path?.includes("/moderations")) {
    return {
      moderation: {
        request: request.request_body.input,
        results: request.response_body?.results,
      },
    };
  } else {
    return {
      completion: {
        request: request.request_body.prompt,
        response: request.response_body?.choices?.[0]?.text,
      },
    };
  }
};

// God this is a mess
function getRequestText(api: RequestWrapper["api"]): string {
  if ("chat" in api) {
    if (!api.chat.request) {
      return "";
    }
    return (api.chat?.request?.at(-1)?.content as string) ?? "";
  } else if ("completion" in api) {
    return api.completion.request ?? "";
  } else if ("moderation" in api) {
    return api.moderation.request ?? "";
  }
  return "";
}

function getResponseText(api: RequestWrapper["api"]): string {
  if ("chat" in api) {
    return (api.chat.response?.content as string) ?? "";
  } else if ("completion" in api) {
    return api.completion.response ?? "";
  } else if ("moderation" in api) {
    return JSON.stringify(api.moderation, null, 2) ?? "";
  }
  return "";
}

export const convertRequest = (request: HeliconeRequest, values: string[]) => {
  const getLogProbs = (logProbs: number[]) => {
    if (logProbs && logProbs.length > 0) {
      const sum = logProbs.reduce((total: any, num: any) => total + num);
      return sum;
    } else {
      return 0;
    }
  };

  const latency =
    (request.delay_ms ??
      new Date(request.response_created_at!).getTime() -
        new Date(request.request_created_at!).getTime()) / 1000;

  const logProbs = request.response_body?.choices?.[0]?.logprobs?.token_logprobs
    ? getLogProbs(request.response_body?.choices?.[0]?.logprobs?.token_logprobs)
    : null;

  const api: RequestWrapper["api"] = getRequestAndResponse(request);
  const obj: RequestWrapper = {
    requestBody: request.request_body,
    responseBody: request.response_body,
    promptName: request.prompt_name || "",
    promptRegex: request.prompt_regex || "",
    requestCreatedAt: request.request_created_at,
    id: request.request_id,
    path: request.request_path,
    customProperties: request.request_properties,
    feedback: request.request_feedback,
    userId: request.request_user_id || "",
    responseCreatedAt: request.response_created_at,
    responseId: request.response_id,
    keyName: request.key_name,
    // More information about the request
    api: getRequestAndResponse(request),
    error: request.response_body?.error || undefined,
    latency,
    totalTokens: request.total_tokens ?? 0,
    completionTokens: request.completion_tokens ?? 0,
    promptTokens: request.prompt_tokens ?? 0,
    model: request.request_body.model || request.response_body?.model || "",
    requestText: getRequestText(api),
    responseText: getResponseText(api),
    logProbs: logProbs,
    probability: logProbs ? Math.exp(logProbs) : null,
    status: request.response_status,
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

  if (obj.feedback) {
    for (const key in obj.feedback) {
      if (obj.feedback.hasOwnProperty(key)) {
        const value = obj.feedback[key];
        obj[key] = value;
      }
    }
  }

  return obj;
};

const useRequestsPage = (
  currentPage: number,
  currentPageSize: number,
  iuFilterIdxs: UIFilterRow[],
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest
) => {
  const {
    properties,
    isLoading: isPropertiesLoading,
    propertyFilters,
    searchPropertyFilters,
  } = useGetProperties();

  const { feedback, isLoading: isFeedbackLoading } = useGetFeedback();

  const filterMap = (REQUEST_TABLE_FILTERS as SingleFilterDef<any>[]).concat(
    propertyFilters
  );

  const filter: FilterNode = {
    left: filterListToTree(
      filterUIToFilterLeafs(filterMap, iuFilterIdxs),
      "and"
    ),
    right: advancedFilter,
    operator: "and",
  };

  const { requests, count } = useGetRequests(
    currentPage,
    currentPageSize,
    filter,
    sortLeaf
  );

  const from = (currentPage - 1) * currentPageSize;
  const to = currentPage * currentPageSize;

  return {
    requests: {
      ...requests,
      data: requests.data?.data?.map((request) => convertRequest(request, [])),
      isLoading: requests.isLoading || requests.isRefetching,
    },
    count,
    from,
    to,
    isPropertiesLoading,
    isValuesLoading: false,
    filterMap,
    refetch: () => {
      requests.refetch();
      count.refetch();
    },
    properties,
    values: [],
    feedback,
    isFeedbackLoading,
    searchPropertyFilters,
  };
};

export default useRequestsPage;

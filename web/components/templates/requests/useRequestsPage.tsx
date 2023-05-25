import { useEffect, useState } from "react";
import { HeliconeRequest } from "../../../lib/api/request/request";
import { ok, Result } from "../../../lib/result";
import { useDebounce } from "../../../services/hooks/debounce";
import { useGetPromptValues } from "../../../services/hooks/promptValues";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetFeedback } from "../../../services/hooks/feedback";
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
import { getPropertyParams } from "../../../services/lib/propertyParams";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { Json } from "../../../supabase/database.types";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { Message } from "./requestsPage";
import { useOrg } from "../../shared/layout/organizationContext";

export type RequestWrapper = {
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
  completionTokens: number;
  promptTokens: number;
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

export const convertRequest = (request: HeliconeRequest, values: string[]) => {
  const getLogProbs = (logProbs: number[]) => {
    if (logProbs && logProbs.length > 0) {
      const sum = logProbs.reduce((total: any, num: any) => total + num);
      return sum;
    } else {
      return 0;
    }
  };

  const getRequestAndResponse = (request: HeliconeRequest) => {
    if (
      request.request_path?.includes("/chat/") ||
      request.request_body.model === "gpt-3.5-turbo"
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
        gpt3: {
          request: request.request_body.prompt,
          response: request.response_body?.choices?.[0]?.text,
        },
      };
    }
  };

  const latency =
    (request.delay_ms ??
      new Date(request.response_created_at!).getTime() -
        new Date(request.request_created_at!).getTime()) / 1000;

  const logProbs = request.response_body?.choices?.[0]?.logprobs?.token_logprobs
    ? getLogProbs(request.response_body?.choices?.[0]?.logprobs?.token_logprobs)
    : null;

  const obj: RequestWrapper = {
    requestBody: request.request_body,
    responseBody: request.response_body,
    promptName: request.prompt_name || "",
    promptRegex: request.prompt_regex || "",
    requestCreatedAt: request.request_created_at,
    formattedPromptId: request.request_formatted_prompt_id || "",
    id: request.request_id,
    path: request.request_path,
    promptValues: request.request_prompt_values,
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
    requestText:
      (request.request_body?.messages &&
        request.request_body?.messages?.length > 0 &&
        request.request_body.messages?.at(-1)) ||
      request.request_body.input ||
      request.request_body.prompt ||
      "",
    responseText:
      (request.response_body?.error?.message &&
        `error: ${request.response_body?.error?.message}`) ||
      request.response_body?.choices?.[0]?.text ||
      request.response_body?.choices?.[0]?.message?.content ||
      JSON.stringify(request.response_body?.results?.[0], null, 2) ||
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

  const filterMap = (requestTableFilters as SingleFilterDef<any>[]).concat(
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

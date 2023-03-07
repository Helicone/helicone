import { Dialog } from "@headlessui/react";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/router";

import { useState } from "react";
import { truncString } from "../../../lib/stringHelpers";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import {
  FilterNode,
  getPropertyFilters,
} from "../../../services/lib/filters/filterDefs";
import {
  RequestsTableFilter,
  UserMetricsTableFilter,
} from "../../../services/lib/filters/frontendFilterDefs";
import { Database, Json } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import ThemedFilter, { Filter } from "../../shared/themed/themedFilter";
import ThemedModal from "../../shared/themed/themedModal";
import { getUSDate } from "../../shared/utils/utils";
import ThemedTableV2, { Column } from "../../ThemedTableV2";
import { Filters } from "../dashboard/filters";
import { Chat } from "./chat";
import { Completion } from "./completion";
import { CompletionRegex } from "./completionRegex";
import RequestDrawer from "./requestDrawer";
import useRequestsPage from "./useRequestsPage";

type Message = {
  role: string;
  content: string;
};

export type ChatProperties = {
  request: Message[] | null;
  response: Message | null;
};

export type CsvData = {
  request_id: string;
  response_id: string;
  error: string;
  time: string;
  request: string;
  response: string;
  total_tokens: number;
  logprobs: number | null;
  request_user_id: string;
  model: string;
  temperature: number | null;
  prompt_name: string;
  isCached: boolean;
  isChat: boolean;
  chatProperties: ChatProperties | null;
  isModeration: boolean;
  moderationFullResponse: string | null;
} & {
  [keys: string]: string | number | null | boolean | ChatProperties;
};

interface RequestsPageProps {
  page: number;
  pageSize: number;
  sortBy: string | null;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const RequestsPage = (props: RequestsPageProps) => {
  const { page, pageSize, sortBy, keys } = props;

  const { setNotification } = useNotification();

  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [advancedFilter, setAdvancedFilter] = useState<FilterNode>("all");
  const [apiKeyFilter, setApiKeyFilter] = useState<FilterNode>("all");

  const [timeFilter, setTimeFilter] = useState<FilterNode>({
    request: {
      created_at: {
        gte: new Date(0).toISOString(),
      },
    },
  });
  const { count, values, from, isLoading, properties, refetch, requests, to } =
    useRequestsPage(currentPage, currentPageSize, {
      left: timeFilter,
      operator: "and",
      right: {
        left: apiKeyFilter,
        operator: "and",
        right: advancedFilter,
      },
    });

  const onTimeSelectHandler = async (key: TimeInterval, value: string) => {
    setTimeFilter({
      request: {
        created_at: {
          gte: getTimeIntervalAgo(key).toISOString(),
        },
      },
    });

    refetch();
  };

  const onPageSizeChangeHandler = async (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    refetch();
  };

  const onPageChangeHandler = async (newPageNumber: number) => {
    setCurrentPage(newPageNumber);
    refetch();
  };

  const [index, setIndex] = useState<number>();
  const [selectedData, setSelectedData] = useState<{
    request_id: string | null;
    response_id: string | null;
    error?: any;
    time: string | null;
    request: string | undefined;
    response: string | undefined;
    "duration (s)": string;
    total_tokens: number | undefined;
    logprobs: any;
    request_user_id: string | null;
    model: string | undefined;
    temperature: number | undefined;
    [keys: string]: any;
  }>();
  const [open, setOpen] = useState(true);

  const probabilities = requests?.map((req) => {
    const choice = (req.response_body as any)?.choices
      ? (req.response_body as any)?.choices[0]
      : null;

    if (!choice) {
      return null;
    }

    let prob;
    if (choice.logprobs !== undefined && choice.logprobs !== null) {
      const tokenLogprobs = choice.logprobs.token_logprobs;
      const sum = tokenLogprobs.reduce(
        (total: any, num: any) => total + num,
        0
      );
      prob = sum.toFixed(2);
    } else {
      prob = "";
    }

    return prob;
  });

  const selectRowHandler = (
    row: {
      request_id: string | null;
      response_id: string | null;
      time: string | null;
      request: string | undefined;
      response: string | undefined;
      "duration (s)": string;
      total_tokens: number | undefined;
      logprobs: any;
      request_user_id: string | null;
      model: string | undefined;
      temperature: number | undefined;
      prompt_regex: string | undefined;
      isChat: boolean;
      chatProperties: ChatProperties | null;
      isModeration: boolean;
      moderationFullResponse: string | null;
      [keys: string]: any;
    },
    idx: number
  ) => {
    setIndex(idx);
    setSelectedData(row);
    setOpen(true);
  };

  type JsonDict = {
    [key: string]: Json;
  };

  const csvData: CsvData[] = requests?.map((d, i) => {
    console.log("d.request_properties", d.request_properties);
    const latency =
      (new Date(d.response_created_at!).getTime() -
        new Date(d.request_created_at!).getTime()) /
      1000;

    let updated_request_properties: {
      [keys: string]: string;
    } = Object.assign(
      {},
      ...properties.map((p) => ({
        [p]: d.request_properties != null ? d.request_properties[p] : null,
      }))
    );

    if (values !== null) {
      updated_request_properties = Object.assign(
        updated_request_properties,
        ...values.map((p) => ({
          [p]:
            d.request_prompt_values != null ? d.request_prompt_values[p] : null,
        }))
      );
    }

    if (d.prompt_regex) {
      updated_request_properties = Object.assign(updated_request_properties, {
        prompt_regex: d.prompt_regex,
      });
    }
    const is_chat = d.request_path?.includes("/chat/") ?? false;
    const is_moderation = d.request_path?.includes("/moderations") ?? false;

    let request;
    let response;
    let chatProperties: ChatProperties | null = null;
    let moderationFullResponse: string | null = null;

    if (is_chat) {
      const request_messages = d.request_body?.messages;
      const last_request_message =
        request_messages?.[request_messages.length - 1].content;
      const response_blob = d.response_body?.choices?.[0];
      const response_content = response_blob?.message?.content;

      request = last_request_message
        ? last_request_message
        : "Cannot find prompt";
      response = response_content
        ? response_content
        : `error: ${JSON.stringify(d.response_body?.error)}`;

      chatProperties = {
        request:
          typeof request_messages === "string"
            ? JSON.parse(request_messages)
            : request_messages,
        response: response_blob?.message,
      };
    } else if (is_moderation) {
      chatProperties = null;
      request = d.request_body?.input;
      response = JSON.stringify(d.response_body?.results[0]);
      moderationFullResponse = JSON.stringify(d.response_body?.results[0]);
    } else {
      chatProperties = null;
      request = d.request_body?.prompt
        ? typeof d.request_body?.prompt === "string"
          ? d.request_body?.prompt
          : JSON.stringify(d.request_body?.prompt)
        : "Cannot find prompt";
      response = d.response_body?.choices?.[0]?.text
        ? d.response_body?.choices?.length === 1
          ? d.response_body?.choices?.[0]?.text
          : JSON.stringify(d.response_body?.choices?.map((c: any) => c.text))
        : `error: ${JSON.stringify(d.response_body?.error)}`;
    }

    return {
      request_id: d.request_id ?? "Cannot find request id",
      response_id: d.response_id ?? "Cannot find response id",
      error: d.response_body?.error ?? "unknown error",
      time: d.request_created_at ?? "Cannot find time",
      request: request,
      response: response,
      "duration (s)": latency.toString(),
      total_tokens: d.response_body?.usage?.total_tokens ?? 0,
      logprobs: probabilities ? probabilities[i] : null,
      request_user_id: d.request_user_id ?? "",
      model: d.response_body?.model ?? "",
      temperature: d.request_body?.temperature ?? null,
      prompt_name: d.prompt_name ?? "",
      isCached: d.is_cached ?? false,
      isChat: is_chat,
      isModeration: is_moderation,
      moderationFullResponse: moderationFullResponse,
      chatProperties: chatProperties,
      key_name: d.key_name ?? "",
      ...updated_request_properties,
    };
  });

  const makeCardProperty = (name: string, val: string) => {
    return (
      <li className="w-full flex flex-row justify-between gap-4 text-sm">
        <p>{name}:</p>
        <p>{val || "{NULL}"}</p>
      </li>
    );
  };

  const propertiesColumns = properties.map((p) => {
    return {
      key: p,
      label: p,
      format: (value: string) => (value ? truncString(value, 15) : value),
    };
  });

  const valuesColumns = values.map((p) => {
    return {
      key: p,
      label: p,
      format: (value: string) => (value ? truncString(value, 15) : value),
    };
  });

  const includePrompt = valuesColumns.length > 0;

  const columns: Column[] = [
    {
      key: "time",
      label: "Time",
      minWidth: 170,
      sortBy: "request_created_at",
      type: "date",
      format: (value: string) => getUSDate(value),
    },
    includePrompt
      ? {
          key: "prompt_name",
          label: "Prompt Name",
          format: (value: string) => value,
          type: "text",
          filter: true,
        }
      : null,
    {
      key: "request",
      label: "Request",
      minWidth: 170,
      type: "text",
      format: (value: string) => truncString(value, 15),
    },
    ...valuesColumns,
    {
      key: "response",
      label: "Response",
      minWidth: 170,
      type: "text",
      format: (value: string) => (value ? truncString(value, 15) : value),
    },
    {
      key: "duration (s)",
      label: "Duration",
      format: (value: string) => `${value} s`,
      type: "number",
      filter: true,
    },
    {
      key: "total_tokens",
      label: "Total Tokens",
      type: "number",
      filter: true,
    },
    {
      key: "logprobs",
      label: "Log Prob",
      type: "number",
      filter: true,
    },
    {
      key: "request_user_id",
      label: "User",
      format: (value: string) => (value ? truncString(value, 15) : value),
      type: "text",
      filter: true,
    },
    ...propertiesColumns,
    {
      key: "model",
      label: "Model",
      filter: true,
      type: "text",
      minWidth: 170,
    },
    {
      key: "isCached",
      label: "Cache",
      minWidth: 170,
      format: (value: boolean) => (value ? "hit" : ""),
    },
    {
      key: "key_name",
      label: "Key Name",
      minWidth: 170,
      type: "text",
      format: (value: string) => value,
    },
  ].filter((column) => column !== null) as Column[];
  const router = useRouter();

  const propertyFilterMap = {
    properties: {
      label: "Properties",
      columns: getPropertyFilters(properties),
    },
  };
  const filterMap =
    properties.length > 0
      ? { ...propertyFilterMap, ...RequestsTableFilter }
      : RequestsTableFilter;

  return (
    <>
      <AuthHeader
        title={"Requests"}
        actions={
          <Filters
            keys={keys}
            filter={apiKeyFilter}
            setFilter={setApiKeyFilter}
          />
        }
      />
      <div className="">
        <div className="mt-4 space-y-2">
          <div className="space-y-2">
            <ThemedFilter
              data={csvData || []}
              isFetching={isLoading}
              onTimeSelectHandler={onTimeSelectHandler}
              timeFilterOptions={[
                { key: "24h", value: "day" },
                { key: "7d", value: "wk" },
                { key: "1m", value: "mo" },
                { key: "all", value: "all" },
              ]}
              customTimeFilter
              fileName="requests.csv"
              filterMap={RequestsTableFilter}
              onAdvancedFilter={(_filters) => {
                router.query.page = "1";
                router.push(router);
                const filters = _filters.filter((f) => f) as FilterNode[];
                if (filters.length === 0) {
                  setAdvancedFilter("all");
                } else {
                  const firstFilter = filters[0];
                  setAdvancedFilter(
                    filters.slice(1).reduce((acc, curr) => {
                      return {
                        left: acc,
                        operator: "and",
                        right: curr,
                      };
                    }, firstFilter)
                  );
                }
              }}
            />

            {isLoading || from === undefined || to === undefined ? (
              <LoadingAnimation title="Getting your requests" />
            ) : (
              <ThemedTableV2
                condensed
                columns={columns}
                rows={csvData || []}
                count={count || 0}
                page={page}
                from={from}
                to={to}
                onSelectHandler={selectRowHandler}
                onPageChangeHandler={onPageChangeHandler}
                onPageSizeChangeHandler={onPageSizeChangeHandler}
              />
            )}
          </div>
        </div>
      </div>
      {open && selectedData !== undefined && index !== undefined && (
        <RequestDrawer
          open={open}
          index={index}
          probabilities={probabilities}
          properties={properties}
          request={selectedData}
          setOpen={setOpen}
          values={values}
        />
      )}
    </>
  );
};

export default RequestsPage;

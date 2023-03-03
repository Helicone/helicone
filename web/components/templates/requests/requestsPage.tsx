import { Dialog } from "@headlessui/react";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

import { useState } from "react";
import { truncString } from "../../../lib/stringHelpers";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { Json } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import ThemedFilter, { Filter } from "../../shared/themed/themedFilter";
import ThemedModal from "../../shared/themed/themedModal";
import { getUSDate } from "../../shared/utils/utils";
import ThemedTableV2, { Column } from "../../ThemedTableV2";
import { Chat } from "./chat";
import { Completion } from "./completion";
import { CompletionRegex } from "./completionRegex";
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
} & {
  [keys: string]: string | number | null | boolean | ChatProperties;
};

interface RequestsPageProps {
  page: number;
  pageSize: number;
  sortBy: string | null;
}

const RequestsPage = (props: RequestsPageProps) => {
  const { page, pageSize, sortBy } = props;

  const { setNotification } = useNotification();

  const [currentTimeFilter, setCurrentTimeFilter] = useState<string>("day");
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);

  const { count, values, from, isLoading, properties, refetch, requests, to } =
    useRequestsPage(
      currentTimeFilter,
      currentPage,
      currentPageSize,
      sortBy,
      []
    );

  const onTimeSelectHandler = async (key: TimeInterval, value: string) => {
    setCurrentTimeFilter(value);
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
    const latency =
      (new Date(d.response_created_at!).getTime() -
        new Date(d.request_created_at!).getTime()) /
      1000;

    let updated_request_properties: {
      [keys: string]: string;
    } = Object.assign(
      {},
      ...properties.map((p) => ({
        [p]:
          d.request_properties != null
            ? (d.request_properties as JsonDict)[p]
            : null,
      }))
    );

    if (values !== null) {
      updated_request_properties = Object.assign(
        updated_request_properties,
        ...values.map((p) => ({
          [p]:
            d.prompt_values != null ? (d.prompt_values as JsonDict)[p] : null,
        }))
      );
    }

    if (d.prompt_regex) {
      updated_request_properties = Object.assign(updated_request_properties, {
        prompt_regex: d.prompt_regex,
      });
    }
    const is_chat = d.request_path?.includes("/chat/") ?? false;

    let request;
    let response;
    let chatProperties: ChatProperties | null = null;

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
        request: request_messages,
        response: response_blob?.message,
      };
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
      chatProperties: chatProperties,
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
  ].filter((column) => column !== null) as Column[];

  return (
    <>
      <AuthHeader title={"Requests"} />
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
              ]}
              customTimeFilter
              fileName="requests.csv"
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
        <ThemedModal open={open} setOpen={setOpen}>
          <div className="sm:w-[750px] sm:max-w-[750px]">
            <div className="mt-1 text-center sm:mt-3">
              <ul className="mt-4 space-y-2">
                <div className="flex flex-wrap">
                  <div className="w-full md:w-1/3 px-4">
                    <div className="border-b border-gray-300">
                      <li className="w-full flex flex-row justify-between gap-4 text-sm py-4">
                        <p>Time:</p>
                        <p>
                          {new Date(selectedData.time || "").toLocaleString()}
                        </p>
                      </li>
                    </div>
                    <div className="border-gray-500">
                      <li className="w-full flex flex-row justify-between gap-4 text-sm py-4">
                        <p>Duration:</p>
                        <p>{selectedData["duration (s)"]}s</p>
                      </li>
                    </div>
                  </div>
                  <div className="w-full md:w-1/3 px-4">
                    <div className="border-b border-gray-300">
                      <li className="w-full flex flex-row justify-between gap-4 text-sm py-4">
                        <p>Tokens:</p>
                        <p>{selectedData.total_tokens}</p>
                      </li>
                    </div>
                    <div className="border-gray-500">
                      <li className="w-full flex flex-row justify-between gap-4 text-sm py-4">
                        <p>Model:</p>
                        <p>{selectedData.model}</p>
                      </li>
                    </div>
                  </div>
                  <div className="w-full md:w-1/3 px-4">
                    <div className="border-b border-gray-300">
                      <li className="w-full flex flex-row justify-between gap-4 text-sm py-4">
                        <p>User Id:</p>
                        <p>{selectedData.request_user_id}</p>
                      </li>
                    </div>
                    {probabilities[index] && (
                      <div className="md:border-b-0">
                        <li className="w-full flex flex-row justify-between gap-4 text-sm py-4">
                          <p>Log Probability:</p>
                          <p>{probabilities ? probabilities[index] : 0}</p>
                        </li>
                      </div>
                    )}
                  </div>
                  {selectedData.error &&
                    selectedData.error != "unknown error" && (
                      <div className="px-4 border-gray-500 overflow-auto text-red-500">
                        <li className="w-full flex flex-row justify-between gap-4 text-sm py-4">
                          <p>Error:</p>
                          <p className="max-w-xl whitespace-pre-wrap text-left">
                            {selectedData.error
                              ? JSON.stringify(selectedData.error)
                              : "{{ no error }}"}
                          </p>
                        </li>
                      </div>
                    )}
                </div>
                {properties
                  .filter((v) => selectedData[v] != null)
                  .map((p) =>
                    makeCardProperty(
                      p,
                      selectedData[p] !== null ? selectedData[p] : "{NULL}"
                    )
                  )}
                {selectedData.isChat ? (
                  <Chat chatProperties={selectedData.chatProperties} />
                ) : !selectedData.prompt_regex ? (
                  <Completion
                    request={selectedData.request}
                    response={selectedData.response}
                  />
                ) : (
                  <CompletionRegex
                    prompt_regex={selectedData.prompt_regex}
                    prompt_name={selectedData.prompt_name}
                    // keys is the values for all the keys in `values`
                    keys={values.reduce((acc, key) => {
                      if (selectedData.hasOwnProperty(key)) {
                        return {
                          ...acc,
                          [key]: selectedData[key],
                        };
                      }
                      return acc;
                    }, {})}
                    response={selectedData.response}
                    values={values}
                  />
                )}
              </ul>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 w-full gap-4 flex flex-row justify-center">
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:text-sm w-32"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex justify-center text-xs font-medium text-gray-500 sm:text-sm items-center"
              onClick={() => {
                setNotification("Copied to clipboard", "success");
                navigator.clipboard.writeText(JSON.stringify(selectedData));
              }}
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </div>
        </ThemedModal>
      )}
    </>
  );
};

export default RequestsPage;

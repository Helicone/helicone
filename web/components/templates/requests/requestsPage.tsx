import { Dialog } from "@headlessui/react";
import {
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import { truncString } from "../../../lib/stringHelpers";
import {
  getRequests,
  ResponseAndRequest,
} from "../../../services/lib/requests";
import { Database, Json } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import ThemedFilter from "../../shared/themedFilter";
import ThemedModal from "../../shared/themedModal";
import StickyHeadTable, { Column } from "../../test";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function escapeCSVString(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  return s.replace(/"/g, '""');
}

interface RequestsPageProps {
  page: number;
  pageSize: number;
  properties: string[];
  sortBy: string | null;
  timeFilter: string | null;
  values: string[];
}

const RequestsPage = (props: RequestsPageProps) => {
  const {
    page,
    pageSize,

    properties,
    sortBy,
    timeFilter,
    values,
  } = props;

  const { setNotification } = useNotification();
  const supabase = useSupabaseClient();

  const [currentTimeFilter, setCurrentTimeFilter] = useState<string | null>(
    "day"
  );
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["requests", currentTimeFilter, currentPage, currentPageSize],
    queryFn: async (timeFilter) => {
      return getRequests(
        supabase,
        currentPage,
        currentPageSize,
        sortBy, // TODO: add sortBy functionality
        timeFilter.queryKey[1] as string | null
      ).then((res) => res);
    },
    refetchOnWindowFocus: false,
  });
  const requests = data?.data;
  const count = data?.count;
  const from = data?.from;
  const to = data?.to;
  const error = data?.error;

  const onTimeSelectHandler = async (key: string, value: string) => {
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
    const choice = req.response_body?.choices
      ? req.response_body?.choices[0]
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
  const csvData = requests?.map((d, i) => {
    const latency =
      (new Date(d.response_created_at!).getTime() -
        new Date(d.request_created_at!).getTime()) /
      1000;

    let updated_request_properties = Object.assign(
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

    return {
      request_id: d.request_id,
      response_id: d.response_id,
      error: d.response_body!.error,
      time: d.request_created_at,
      request: d.request_body?.prompt,
      response: d.response_body!.error
        ? `error: ${d.response_body!.error.type}`
        : d.response_body?.choices?.[0]?.text,
      "duration (s)": latency.toString(),
      total_tokens: d.response_body?.usage?.total_tokens,
      logprobs: probabilities ? probabilities[i] : null,
      request_user_id: d.request_user_id,
      model: d.response_body?.model,
      temperature: d.request_body?.temperature,
      prompt_name: d.prompt_name,
      isCached: d.is_cached,
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
  const getUSDate = (value: string) => {
    const date = new Date(value);
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}, ${date.toLocaleTimeString().slice(0, -6)} ${date
      .toLocaleTimeString()
      .slice(-2)}`;
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

  const columns: readonly Column[] = [
    {
      key: "time",
      label: "Time",
      minWidth: 170,
      sortBy: "request_created_at",
      format: (value: string) => getUSDate(value),
    },
    includePrompt
      ? {
          key: "prompt_name",
          label: "Prompt Name",
          format: (value: string) => value,
        }
      : null,
    {
      key: "request",
      label: "Request",
      minWidth: 170,
      format: (value: string) => truncString(value, 15),
    },
    ...valuesColumns,
    {
      key: "response",
      label: "Response",
      minWidth: 170,
      format: (value: string) => (value ? truncString(value, 15) : value),
    },
    {
      key: "duration (s)",
      label: "Duration",
      format: (value: string) => `${value} s`,
    },
    {
      key: "total_tokens",
      label: "Total Tokens",
    },
    {
      key: "logprobs",
      label: "Log Prob",
    },
    {
      key: "request_user_id",
      label: "User",
      format: (value: string) => (value ? truncString(value, 15) : value),
    },
    ...propertiesColumns,
    {
      key: "model",
      label: "Model",
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
              isFetching={isLoading || isRefetching}
              onTimeSelectHandler={onTimeSelectHandler}
            />

            {isLoading ||
            isRefetching ||
            from === undefined ||
            to === undefined ? (
              <LoadingAnimation title="Getting your requests" />
            ) : (
              <StickyHeadTable
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
          <div className="sm:w-[600px] sm:max-w-[600px]">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
              <InformationCircleIcon
                className="h-8 w-8 text-sky-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1 text-center sm:mt-3">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Request Information
              </Dialog.Title>
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex w-full justify-center text-base font-medium text-gray-500 sm:text-sm items-center"
                onClick={() => {
                  setNotification("Copied to clipboard", "success");
                  navigator.clipboard.writeText(JSON.stringify(selectedData));
                }}
              >
                Copy this request{" "}
                <ClipboardDocumentIcon className="h-5 w-5 ml-1" />
              </button>
              <ul className="mt-4 space-y-2">
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Time:</p>
                  <p>{new Date(selectedData.time || "").toLocaleString()}</p>
                </li>

                {selectedData.error && (
                  <li className="w-full flex flex-row justify-between gap-4 text-sm">
                    <p>Error:</p>
                    <p className="max-w-xl whitespace-pre-wrap text-left">
                      {selectedData.error
                        ? JSON.stringify(selectedData.error)
                        : "{{ no error }}"}
                    </p>
                  </li>
                )}

                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Duration:</p>
                  <p>{selectedData["duration (s)"]}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Tokens:</p>
                  <p>{selectedData.total_tokens}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Log Probability:</p>
                  <p>{probabilities ? probabilities[index] : 0}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>User Id:</p>
                  <p>{selectedData.request_user_id}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Model:</p>
                  <p>{selectedData.model}</p>
                </li>
                {properties
                  .filter((v) => selectedData[v] != null)
                  .map((p) =>
                    makeCardProperty(
                      p,
                      selectedData[p] !== null ? selectedData[p] : "{NULL}"
                    )
                  )}
                {!selectedData.prompt_regex ? (
                  <div className="flex flex-col sm:flex-row gap-4 text-sm w-full">
                    <div className="w-full flex flex-col text-left space-y-1">
                      <p>Request:</p>
                      <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[250px] max-h-[250px] overflow-auto">
                        {selectedData.request}
                      </p>
                    </div>
                    <div className="w-full flex flex-col text-left space-y-1">
                      <p>Response:</p>
                      <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[250px] max-h-[250px] overflow-auto">
                        {selectedData.response}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="w-full flex flex-col text-left space-y-1 text-sm">
                        <p>{selectedData.prompt_name}:</p>
                        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[150px] max-h-[150px] overflow-auto">
                          {selectedData.prompt_regex}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 text-sm w-full">
                      {values
                        .filter((v) => selectedData[v] != null)
                        .map((v) => (
                          <div
                            className="w-full flex flex-col text-left space-y-1 text-sm"
                            key={v}
                          >
                            <p>{v}:</p>
                            <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[100px] overflow-auto">
                              {selectedData[v]}
                            </p>
                          </div>
                        ))}
                    </div>
                    <div className="w-full flex flex-col text-left space-y-1 text-sm">
                      <p>Response:</p>
                      <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[150px] max-h-[150px] overflow-auto">
                        {selectedData.response}
                      </p>
                    </div>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 w-full justify-between gap-4 flex flex-row">
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:text-sm"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </ThemedModal>
      )}
    </>
  );
};

export default RequestsPage;

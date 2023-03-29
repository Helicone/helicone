import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { createColumnHelper } from "@tanstack/react-table";
import { useRouter } from "next/router";
import Papa from "papaparse";

import { useEffect, useState } from "react";
import { HeliconeRequest } from "../../../lib/api/request/request";
import { Result } from "../../../lib/result";
import { truncString } from "../../../lib/stringHelpers";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useGetKeys } from "../../../services/hooks/keys";
import { useLocalStorageState } from "../../../services/hooks/localStorage";
import { FilterNode, parseKey } from "../../../services/lib/filters/filterDefs";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/sorts";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedTableHeader, {
  escapeCSVString,
} from "../../shared/themed/themedTableHeader";
import ThemedTableV3 from "../../shared/themed/themedTableV3";
import {
  capitalizeWords,
  getUSDate,
  removeLeadingWhitespace,
} from "../../shared/utils/utils";
import { Column } from "../../ThemedTableV2";
import { Filters } from "../dashboard/filters";
import RequestDrawer from "./requestDrawer";
import useRequestsPage, { RequestWrapper } from "./useRequestsPage";

export type Message = {
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
}

const RequestsPage = (props: RequestsPageProps) => {
  const { page, pageSize, sortBy } = props;

  const truncLength = 30;

  const [viewMode, setViewMode] = useState<"Condensed" | "Expanded">(
    "Condensed"
  );

  const initialColumns: Column[] = [
    {
      key: "requestCreatedAt",
      active: true,
      label: "Time",
      minWidth: 170,
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        created_at: direction,
      }),
      type: "timestamp",
      format: (value: string) => getUSDate(value),
    },
    {
      key: "requestText",
      active: true,
      label: "Request",
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        request_prompt: direction,
      }),
      minWidth: 240,
      type: "text",
      format: (value: string | { content: string; role: string }, mode) =>
        typeof value === "string"
          ? mode === "Condensed"
            ? removeLeadingWhitespace(truncString(value, truncLength))
            : removeLeadingWhitespace(truncString(value, 5000))
          : mode === "Condensed"
          ? removeLeadingWhitespace(truncString(value.content, truncLength))
          : removeLeadingWhitespace(truncString(value.content, 5000)),
    },
    {
      key: "responseText",
      active: true,
      label: "Response",
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        response_text: direction,
      }),
      minWidth: 240,
      type: "text",
      format: (value: string, mode) =>
        value && mode === "Condensed"
          ? removeLeadingWhitespace(truncString(value, truncLength))
          : removeLeadingWhitespace(value),
    },
    {
      key: "totalTokens",
      active: true,
      label: "Total Tokens",
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        total_tokens: direction,
      }),
      type: "number",
      filter: true,
    },
    {
      key: "userId",
      active: true,
      label: "User",
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        user_id: direction,
      }),
      format: (value: string) =>
        value ? truncString(value, truncLength) : value,
      type: "text",
      filter: true,
      minWidth: 170,
    },
    {
      key: "model",
      active: true,
      label: "Model",
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        body_model: direction,
      }),
      filter: true,
      type: "text",
      minWidth: 200,
    },
    {
      key: "keyName",
      active: false,
      label: "Key Name",
      minWidth: 170,
      type: "text",
      format: (value: string) => value,
    },
    {
      key: "cacheCount",
      active: false,
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        is_cached: direction,
      }),
      label: "Cache hits",
      minWidth: 170,
      format: (value: number) => value.toFixed(0),
    },
    {
      key: "logProbs",
      active: false,
      label: "Log Prob",
      type: "number",
      filter: true,
      format: (value: number) => (value ? value.toFixed(2) : ""),
    },
  ];

  const localStorageColumns =
    typeof window !== "undefined"
      ? localStorage.getItem("requestsColumns")
      : null;

  const sessionStorageKey =
    typeof window !== "undefined" ? sessionStorage.getItem("currentKey") : null;

  const parsed = JSON.parse(localStorageColumns || "[]") as Column[];

  const [defaultColumns, setDefaultColumns] =
    useState<Column[]>(initialColumns);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [advancedFilters, setAdvancedFilters] = useLocalStorageState<
    UIFilterRow[]
  >("advancedFilters", []);

  const [orderBy, setOrderBy] = useState<{
    column: keyof RequestWrapper;
    direction: SortDirection;
  }>({
    column: "",
    direction: "desc",
  });
  const [sortLeaf, setSortLeaf] = useState<SortLeafRequest>({
    created_at: "desc",
  });
  const [apiKeyFilter, setApiKeyFilter] = useState<string | null>(
    sessionStorageKey
  );

  const [timeFilter, setTimeFilter] = useState<FilterNode>({
    request: {
      created_at: {
        gte: getTimeIntervalAgo("7d").toISOString(),
      },
    },
  });
  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  const {
    count,
    values,
    from,
    isLoading,
    properties,
    refetch,
    filterMap,
    requests,
    to,
  } = useRequestsPage(
    currentPage,
    currentPageSize,
    debouncedAdvancedFilter,
    {
      left: timeFilter,
      operator: "and",
      right: apiKeyFilter ? parseKey(apiKeyFilter) : "all",
    },
    sortLeaf
  );

  const { keys, isLoading: isKeysLoading } = useGetKeys();

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

  const [selectedData, setSelectedData] = useState<RequestWrapper>();
  const [open, setOpen] = useState(true);

  const selectRowHandler = (row: RequestWrapper, idx: number) => {
    setSelectedData(row);
    setOpen(true);
  };

  // columns

  const [columns, setColumns] = useState<Column[]>(defaultColumns);

  useEffect(() => {
    if (
      columns.length > initialColumns.length ||
      (values.length === 0 && properties.length === 0)
    ) {
      if (parsed) {
        columns.forEach((column) => {
          const match = parsed.find((c) => c.key === column.key);
          if (match) {
            column.active = match.active;
          }
        });
      }
      return;
    }
    const propertiesColumns: Column[] = properties.map((p) => {
      return {
        key: p,
        label: capitalizeWords(p),
        active: true,
        sortBy: "desc",
        toSortLeaf: (direction) => ({
          properties: {
            [p]: direction,
          },
        }),
        columnOrigin: "property",
        format: (value: string, mode) =>
          value && mode === "Condensed"
            ? truncString(value, truncLength)
            : value,
        minWidth: 170,
      };
    });

    const valuesColumns: Column[] = values.map((p) => {
      return {
        key: p,
        label: capitalizeWords(p),
        active: true,
        sortBy: "desc",
        toSortLeaf: (direction) => ({
          values: {
            [p]: direction,
          },
        }),
        columnOrigin: "value",
        format: (value: string, mode) =>
          value && mode === "Condensed"
            ? truncString(value, truncLength)
            : value,
      };
    });

    const newColumns = [
      ...defaultColumns,
      ...valuesColumns,
      ...propertiesColumns,
    ];

    if (parsed) {
      newColumns.forEach((column) => {
        const match = parsed.find((c) => c.key === column.key);
        if (match) {
          column.active = match.active;
        }
      });
    }

    setColumns(newColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultColumns, values, properties]);

  const columnOrderIndex = columns.findIndex((c) => c.key === orderBy.column);
  if (columnOrderIndex > -1) {
    columns[columnOrderIndex].sortBy = orderBy.direction;
  }

  const columnHelper = createColumnHelper<RequestWrapper>();

  async function downloadCSV() {
    try {
      const response = await fetch("/api/export/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: advancedFilters,
          offset: (currentPage - 1) * currentPageSize,
          limit: 5000,
          sort: sortLeaf,
        }),
      });
      if (!response.ok) {
        throw new Error("An error occurred while downloading the CSV file");
      }

      const csvData = await response.text();
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "requests.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the Blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <AuthHeader
        title={"Requests"}
        headerActions={
          <button
            onClick={() => refetch()}
            className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
          >
            <ArrowPathIcon
              className={clsx(
                isLoading ? "animate-spin" : "",
                "h-5 w-5 inline"
              )}
            />
          </button>
        }
        actions={
          <div className="flex flex-row space-x-8 items-center">
            {!isKeysLoading ? (
              <Filters keys={keys} setFilter={setApiKeyFilter} />
            ) : (
              <div className="h-10"></div>
            )}
          </div>
        }
      />
      <div className="">
        <div className="mt-4 space-y-2">
          <div className="space-y-4">
            <ThemedTableHeader
              view={{
                viewMode,
                setViewMode,
              }}
              editColumns={{
                columns: columns,
                onColumnCallback: (columns) => {
                  const active = columns.map((c) => {
                    return {
                      key: c.key,
                      active: c.active,
                    };
                  });
                  localStorage.setItem(
                    "requestsColumns",
                    JSON.stringify(active)
                  );
                  setDefaultColumns(columns);
                },
              }}
              timeFilter={{
                customTimeFilter: true,
                defaultTimeFilter: "7d",
                onTimeSelectHandler: onTimeSelectHandler,
                timeFilterOptions: [
                  { key: "24h", value: "Today" },
                  { key: "7d", value: "7D" },
                  { key: "1m", value: "1M" },
                  { key: "3m", value: "3M" },
                  { key: "all", value: "All" },
                ],
              }}
              csvExport={{
                onClick: downloadCSV,
              }}
              isFetching={isLoading}
              advancedFilter={{
                filterMap,
                onAdvancedFilter: setAdvancedFilters,
                filters: advancedFilters,
              }}
            />
            {isLoading || from === undefined || to === undefined ? (
              <LoadingAnimation title="Getting your requests" />
            ) : (
              <ThemedTableV3
                data={requests}
                sortColumns={columns}
                columns={columns
                  .filter((c) => c.active)
                  .map((c) =>
                    columnHelper.accessor(c.key as string, {
                      cell: (info) =>
                        c.format ? (
                          <span className="whitespace-pre-wrap max-w-7xl break-all">
                            {c.format(info.getValue(), viewMode)}
                          </span>
                        ) : (
                          info.getValue()
                        ),
                      header: () => <span>{c.label}</span>,
                      size: c.minWidth,
                    })
                  )}
                count={count || 0}
                page={page}
                from={from}
                to={to}
                onSelectHandler={selectRowHandler}
                onPageChangeHandler={onPageChangeHandler}
                onPageSizeChangeHandler={onPageSizeChangeHandler}
                onSortHandler={(key) => {
                  if (key.key === orderBy.column) {
                    setOrderBy({
                      column: key.key,
                      direction: orderBy.direction === "asc" ? "desc" : "asc",
                    });
                    key.toSortLeaf &&
                      setSortLeaf(
                        key.toSortLeaf(
                          orderBy.direction === "asc" ? "desc" : "asc"
                        )
                      );
                  } else {
                    key.toSortLeaf && setSortLeaf(key.toSortLeaf("asc"));
                    setOrderBy({
                      column: key.key,
                      direction: "asc",
                    });
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
      {open && selectedData !== undefined && (
        <RequestDrawer
          open={open}
          wrappedRequest={selectedData}
          setOpen={setOpen}
          values={values}
          properties={properties}
        />
      )}
    </>
  );
};

export default RequestsPage;

import { useRouter } from "next/router";

import { useState } from "react";
import { truncString } from "../../../lib/stringHelpers";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useGetKeys } from "../../../services/hooks/keys";
import { useGetPropertyParams } from "../../../services/hooks/propertyParams";
import {
  FilterNode,
  getPropertyFilters,
} from "../../../services/lib/filters/filterDefs";
import { RequestsTableFilter } from "../../../services/lib/filters/frontendFilterDefs";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/sorts";
import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedFilter from "../../shared/themed/themedFilter";
import { getUSDate } from "../../shared/utils/utils";
import ThemedTableV2, { Column } from "../../ThemedTableV2";
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

const defaultColumns: Column[] = [
  {
    key: "requestCreatedAt",
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
    label: "Request",
    sortBy: "desc",
    toSortLeaf: (direction) => ({
      request_prompt: direction,
    }),
    minWidth: 170,
    type: "text",
    format: (value: string | { content: string; role: string }) =>
      typeof value === "string"
        ? truncString(value, 15)
        : truncString(value.content, 15),
  },
  {
    key: "responseText",
    label: "Response",
    sortBy: "desc",
    toSortLeaf: (direction) => ({
      response_text: direction,
    }),
    minWidth: 170,
    type: "text",
    format: (value: string) => (value ? truncString(value, 15) : value),
  },
  {
    key: "latency",
    label: "Duration",
    format: (value: string) => `${value} s`,
    sortBy: "desc",
    toSortLeaf: (direction) => ({
      latency: direction,
    }),
    type: "number",
    filter: true,
  },
  {
    key: "totalTokens",
    label: "Total Tokens",
    sortBy: "desc",
    toSortLeaf: (direction) => ({
      total_tokens: direction,
    }),
    type: "number",
    filter: true,
  },
  {
    key: "logProbs",
    label: "Log Prob",
    type: "number",
    filter: true,
    format: (value: number) => (value ? value.toFixed(2) : ""),
  },
  {
    key: "userId",
    label: "User",
    sortBy: "desc",
    toSortLeaf: (direction) => ({
      user_id: direction,
    }),
    format: (value: string) => (value ? truncString(value, 15) : value),
    type: "text",
    filter: true,
    minWidth: 170,
  },
  {
    key: "model",
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
    key: "cacheCount",
    sortBy: "desc",
    toSortLeaf: (direction) => ({
      is_cached: direction,
    }),
    label: "Cache hits",
    minWidth: 170,
    format: (value: number) => value.toFixed(0),
  },
  {
    key: "keyName",
    label: "Key Name",
    minWidth: 170,
    type: "text",
    format: (value: string) => value,
  },
];

const RequestsPage = (props: RequestsPageProps) => {
  const { page, pageSize, sortBy } = props;

  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [advancedFilter, setAdvancedFilter] = useState<FilterNode>("all");
  const [orderBy, setOrderBy] = useState<{
    column: string;
    direction: SortDirection;
  }>({
    column: "",
    direction: "desc",
  });
  const [sortLeaf, setSortLeaf] = useState<SortLeafRequest>({
    created_at: "desc",
  });
  const [apiKeyFilter, setApiKeyFilter] = useState<FilterNode>("all");

  const [timeFilter, setTimeFilter] = useState<FilterNode>({
    request: {
      created_at: {
        gte: new Date(0).toISOString(),
      },
    },
  });

  const { count, values, from, isLoading, properties, refetch, requests, to } =
    useRequestsPage(
      currentPage,
      currentPageSize,
      {
        left: timeFilter,
        operator: "and",
        right: {
          left: apiKeyFilter,
          operator: "and",
          right: advancedFilter,
        },
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

  const [index, setIndex] = useState<number>();

  const [selectedData, setSelectedData] = useState<RequestWrapper>();
  const [open, setOpen] = useState(true);

  const selectRowHandler = (row: RequestWrapper, idx: number) => {
    setIndex(idx);
    setSelectedData(row);
    setOpen(true);
  };

  const propertiesColumns: Column[] = properties.map((p) => {
    return {
      key: p,
      label: p,
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        properties: {
          [p]: direction,
        },
      }),
      columnOrigin: "property",
      format: (value: string) => (value ? truncString(value, 15) : value),
      minWidth: 170,
    };
  });

  const valuesColumns: Column[] = values.map((p) => {
    return {
      key: p,
      label: p,
      sortBy: "desc",
      toSortLeaf: (direction) => ({
        values: {
          [p]: direction,
        },
      }),
      columnOrigin: "value",
      format: (value: string) => (value ? truncString(value, 15) : value),
    };
  });

  const includePrompt = valuesColumns.length > 0;

  const columns: Column[] = [
    ...defaultColumns,
    ...valuesColumns,
    ...propertiesColumns,
  ];
  if (includePrompt) {
    columns.push({
      key: "prompt_name",
      label: "Prompt Name",
      format: (value: string) => value,
      type: "text",
      filter: true,
    });
  }

  const columnOrderIndex = columns.findIndex((c) => c.key === orderBy.column);
  if (columnOrderIndex > -1) {
    columns[columnOrderIndex].sortBy = orderBy.direction;
  }

  const router = useRouter();
  const { propertyParams } = useGetPropertyParams();

  const propertyFilterMap = {
    properties: {
      label: "Properties",
      columns: getPropertyFilters(
        properties,
        propertyParams.map((p) => p.property_param)
      ),
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
          !isKeysLoading ? (
            <Filters
              keys={keys}
              filter={apiKeyFilter}
              setFilter={setApiKeyFilter}
            />
          ) : (
            <></>
          )
        }
      />

      <div className="">
        <div className="mt-4 space-y-2">
          <div className="space-y-2">
            <ThemedFilter
              data={null}
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
              filterMap={filterMap}
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
                rows={requests}
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
      {open && selectedData !== undefined && index !== undefined && (
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

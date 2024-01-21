import React, { useEffect, useState } from "react";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import AuthHeader from "../../shared/authHeader";
import useRequestsPageV2 from "./useRequestsPageV2";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import RequestDrawerV2 from "./requestDrawerV2";
import TableFooter from "./tableFooter";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { getInitialColumns } from "./initialColumns";
import { useDebounce } from "../../../services/hooks/debounce";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import { useRouter } from "next/router";
import { HeliconeRequest } from "../../../lib/api/request/request";
import { Result } from "../../../lib/result";
import { useLocalStorage } from "../../../services/hooks/localStorage";

import { ThemedSwitch } from "../../shared/themed/themedSwitch";
import useSearchParams from "../../shared/utils/useSearchParams";
import { TimeFilter } from "../dashboard/dashboardPage";
import RequestCard from "./requestCard";
import getNormalizedRequest from "./builder/requestBuilder";
import { getHeliconeCookie } from "../../../lib/cookies";
import { useOrg } from "../../layout/organizationContext";
import { CreateDataSetModal } from "../fine-tune/dataSetModal";

interface RequestsPageV2Props {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  isCached?: boolean;
  initialRequestId?: string;
}

function getSortLeaf(
  sortKey: string | null,
  sortDirection: SortDirection | null,
  isCustomProperty: boolean,
  isCached: boolean
): SortLeafRequest {
  if (isCached && sortKey === "created_at") {
    sortKey = "cache_created_at";
  }
  if (sortKey && sortDirection && isCustomProperty) {
    return {
      properties: {
        [sortKey]: sortDirection,
      },
    };
  } else if (sortKey && sortDirection) {
    return {
      [sortKey]: sortDirection,
    };
  } else if (isCached) {
    return {
      cache_created_at: "desc",
    };
  } else {
    return {
      created_at: "desc",
    };
  }
}

export function encodeFilter(filter: UIFilterRow): string {
  return `${filter.filterMapIdx}:${filter.operatorIdx}:${encodeURIComponent(
    filter.value
  )}`;
}

function getTableName(isCached: boolean): string {
  return isCached ? "cache_hits" : "request";
}

export function decodeFilter(encoded: string): UIFilterRow | null {
  try {
    const parts = encoded.split(":");
    if (parts.length !== 3) return null;
    const filterMapIdx = parseInt(parts[0], 10);
    const operatorIdx = parseInt(parts[1], 10);
    const value = decodeURIComponent(parts[2]);

    if (isNaN(filterMapIdx) || isNaN(operatorIdx)) return null;

    return { filterMapIdx, operatorIdx, value };
  } catch (error) {
    console.error("Error decoding filter:", error);
    return null;
  }
}

const RequestsPageV2 = (props: RequestsPageV2Props) => {
  const {
    currentPage,
    pageSize,
    sort,
    isCached = false,
    initialRequestId,
  } = props;
  const [isLive, setIsLive] = useLocalStorage("isLive", false);
  const org = useOrg();

  // set the initial selected data on component load
  useEffect(() => {
    if (initialRequestId) {
      const fetchRequest = async () => {
        if (!org?.currentOrg?.id) {
          return;
        }
        const authFromCookie = getHeliconeCookie();
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/request/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "helicone-authorization": JSON.stringify({
                _type: "jwt",
                token: authFromCookie.data?.jwtToken,
                orgId: org?.currentOrg?.id,
              }),
            },
            body: JSON.stringify({
              filter: {
                left: {
                  request: {
                    id: {
                      equals: initialRequestId,
                    },
                  },
                },
                operator: "and",
                right: "all",
              } as FilterNode,
              offset: 0,
              limit: 1,
              sort: {},
            }),
          }
        )
          .then(
            (res) => res.json() as Promise<Result<HeliconeRequest[], string>>
          )
          .then((res) => {
            const { data, error } = res;
            if (data !== null && data.length > 0) {
              const normalizedRequest = getNormalizedRequest(data[0]);
              setSelectedData(normalizedRequest);
              setOpen(true);
            }
          });
      };
      fetchRequest();
    }
  }, [initialRequestId, org?.currentOrg?.id]);

  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [open, setOpen] = useState(false);
  const [selectedDataIndex, setSelectedDataIndex] = useState<number>();
  const [selectedData, setSelectedData] = useState<
    NormalizedRequest | undefined
  >(undefined);
  const searchParams = useSearchParams();

  const getTimeFilter = () => {
    const currentTimeFilter = searchParams.get("t");
    const tableName = getTableName(isCached);

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const [_, start, end] = currentTimeFilter.split("_");

      const filter: FilterNode = {
        left: {
          [tableName]: {
            created_at: {
              gte: new Date(start).toISOString(),
            },
          },
        },
        operator: "and",
        right: {
          [tableName]: {
            created_at: {
              lte: new Date(end).toISOString(),
            },
          },
        },
      };
      return filter;
    } else {
      return {
        [tableName]: {
          created_at: {
            gte: getTimeIntervalAgo(
              (searchParams.get("t") as TimeInterval) || "24h"
            ).toISOString(),
          },
        },
      };
    }
  };

  const getAdvancedFilters = (): UIFilterRow[] => {
    try {
      const currentAdvancedFilters = searchParams.get("filters");

      if (currentAdvancedFilters) {
        const filters = decodeURIComponent(currentAdvancedFilters).slice(2, -2);
        const decodedFilters = filters
          .split("|")
          .map(decodeFilter)
          .filter((filter) => filter !== null) as UIFilterRow[];

        return decodedFilters;
      }
    } catch (error) {
      console.error("Error decoding advanced filters:", error);
    }
    return [];
  };

  const getTimeRange = () => {
    const currentTimeFilter = searchParams.get("t");
    let range: TimeFilter;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("24h");
      const end = new Date(currentTimeFilter.split("_")[2] || new Date());
      range = {
        start,
        end,
      };
    } else {
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "24h"),
        end: new Date(),
      };
    }
    return range;
  };

  const [fineTuneModalOpen, setFineTuneModalOpen] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<FilterNode>(getTimeFilter());
  const [timeRange, setTimeRange] = useState<TimeFilter>(getTimeRange());

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>(
    getAdvancedFilters()
  );

  const router = useRouter();

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  const sortLeaf: SortLeafRequest = getSortLeaf(
    sort.sortKey,
    sort.sortDirection,
    sort.isCustomProperty,
    isCached
  );

  const {
    count,
    isDataLoading,
    isCountLoading,
    requests,
    properties,
    refetch,
    filterMap,
    searchPropertyFilters,
    filter: builtFilter,
  } = useRequestsPageV2(
    page,
    currentPageSize,
    debouncedAdvancedFilter,
    {
      left: timeFilter,
      operator: "and",
      right: "all",
    },
    sortLeaf,
    isCached,
    isLive
  );

  useEffect(() => {
    if (router.query.page) {
      setPage(1);
      router.replace({
        pathname: router.pathname,
        query: { ...router.query, page: 1 },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAdvancedFilter]);

  const onPageSizeChangeHandler = async (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    refetch();
  };

  const onPageChangeHandler = async (newPageNumber: number) => {
    setPage(newPageNumber);
    refetch();
  };

  const onTimeSelectHandler = (key: TimeInterval, value: string) => {
    const tableName = getTableName(isCached);
    if (key === "custom") {
      const [start, end] = value.split("_");
      const filter: FilterNode = {
        left: {
          [tableName]: {
            created_at: {
              gte: new Date(start).toISOString(),
            },
          },
        },
        operator: "and",
        right: {
          [tableName]: {
            created_at: {
              lte: new Date(end).toISOString(),
            },
          },
        },
      };
      setTimeFilter(filter);
      return;
    }
    setTimeFilter({
      [tableName]: {
        created_at: {
          gte: getTimeIntervalAgo(key).toISOString(),
        },
      },
    });
  };

  const columnsWithProperties = [...getInitialColumns(isCached)].concat(
    properties.map((property) => {
      return {
        accessorFn: (row) =>
          row.customProperties ? row.customProperties[property] : "",
        id: `Custom - ${property}`,
        header: property,
        cell: (info) => info.getValue(),
        meta: {
          sortKey: property,
          isCustomProperty: true,
        },
      };
    })
  );

  const onSetAdvancedFilters = (filters: UIFilterRow[]) => {
    if (filters.length > 0) {
      const currentAdvancedFilters = encodeURIComponent(
        JSON.stringify(filters.map(encodeFilter).join("|"))
      );
      searchParams.set("filters", JSON.stringify(currentAdvancedFilters));
    } else {
      searchParams.delete("filters");
    }

    setAdvancedFilters(filters);
  };

  const onRowSelectHandler = (row: NormalizedRequest, index: number) => {
    setSelectedDataIndex(index);
    setSelectedData(row);
    setOpen(true);
    searchParams.set("requestId", row.id);
  };

  return (
    <div>
      <AuthHeader
        title={isCached ? "Cached Requests" : "Requests"}
        headerActions={
          <div className="flex flex-row gap-2">
            <button
              onClick={() => refetch()}
              className="font-medium text-black dark:text-white text-sm items-center flex flex-row hover:text-sky-700 dark:hover:text-sky-300"
            >
              <ArrowPathIcon
                className={clsx(
                  isDataLoading ? "animate-spin" : "",
                  "h-5 w-5 inline"
                )}
              />
            </button>
          </div>
        }
        actions={
          <>
            <ThemedSwitch checked={isLive} onChange={setIsLive} label="Live" />
          </>
        }
      />
      <div className="flex flex-col space-y-4">
        <ThemedTableV5
          defaultData={requests || []}
          defaultColumns={columnsWithProperties}
          tableKey="requestsColumnVisibility"
          dataLoading={isDataLoading}
          sortable={sort}
          advancedFilters={{
            filterMap: filterMap,
            filters: advancedFilters,
            setAdvancedFilters: onSetAdvancedFilters,
            searchPropertyFilters: searchPropertyFilters,
          }}
          onDataSet={() => {
            setFineTuneModalOpen(true);
          }}
          exportData={requests.map((request) => {
            const flattenedRequest: any = {};
            Object.entries(request).forEach(([key, value]) => {
              // key is properties and value is not null
              if (
                key === "customProperties" &&
                value !== null &&
                value !== undefined
              ) {
                Object.entries(value).forEach(([key, value]) => {
                  if (value !== null) {
                    flattenedRequest[key] = value;
                  }
                });
              } else {
                flattenedRequest[key] = value;
              }
            });
            return flattenedRequest;
          })}
          timeFilter={{
            currentTimeFilter: timeRange,
            defaultValue: "24h",
            onTimeSelectHandler: onTimeSelectHandler,
          }}
          onRowSelect={(row, index) => {
            onRowSelectHandler(row, index);
          }}
          makeCard={(row) => {
            return <RequestCard request={row} properties={properties} />;
          }}
          makeRow={{
            properties: properties,
          }}
        />
        <TableFooter
          currentPage={currentPage}
          pageSize={pageSize}
          isCountLoading={isCountLoading}
          count={count || 0}
          onPageChange={onPageChangeHandler}
          onPageSizeChange={onPageSizeChangeHandler}
          pageSizeOptions={[25, 50, 100]}
        />
      </div>
      <RequestDrawerV2
        open={open}
        setOpen={setOpen}
        request={selectedData}
        properties={properties}
        hasPrevious={selectedDataIndex !== undefined && selectedDataIndex > 0}
        hasNext={
          selectedDataIndex !== undefined &&
          selectedDataIndex < requests.length - 1
        }
        onPrevHandler={() => {
          if (selectedDataIndex !== undefined && selectedDataIndex > 0) {
            setSelectedDataIndex(selectedDataIndex - 1);
            setSelectedData(requests[selectedDataIndex - 1]);
            searchParams.set("requestId", requests[selectedDataIndex - 1].id);
          }
        }}
        onNextHandler={() => {
          if (
            selectedDataIndex !== undefined &&
            selectedDataIndex < requests.length - 1
          ) {
            setSelectedDataIndex(selectedDataIndex + 1);
            setSelectedData(requests[selectedDataIndex + 1]);
            searchParams.set("requestId", requests[selectedDataIndex + 1].id);
          }
        }}
      />
      <CreateDataSetModal
        filter={builtFilter}
        setOpen={setFineTuneModalOpen}
        open={fineTuneModalOpen}
        uiFilter={advancedFilters}
        filterMap={filterMap}
      />
    </div>
  );
};

export default RequestsPageV2;

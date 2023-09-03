import React, { useEffect, useRef, useState } from "react";
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
import getRequestBuilder from "./builder/requestBuilder";
import { Result } from "../../../lib/result";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import useNotification from "../../shared/notification/useNotification";
import { Switch } from "@headlessui/react";
import { BoltIcon, BoltSlashIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { RequestView } from "./RequestView";
import { ThemedSwitch } from "../../shared/themed/themedSwitch";

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

const RequestsPageV2 = (props: RequestsPageV2Props) => {
  const {
    currentPage,
    pageSize,
    sort,
    isCached = false,
    initialRequestId,
  } = props;
  const [isLive, setIsLive] = useLocalStorage("isLive", false);

  // set the initial selected data on component load
  useEffect(() => {
    if (initialRequestId) {
      const fetchRequest = async () => {
        const resp = await fetch(`/api/request/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        })
          .then(
            (res) => res.json() as Promise<Result<HeliconeRequest[], string>>
          )
          .then((res) => {
            const { data, error } = res;
            if (data !== null && data.length > 0) {
              const normalizedRequest = getRequestBuilder(data[0]).build();
              setSelectedData(normalizedRequest);
              setOpen(true);
            }
          });
      };
      fetchRequest();
    }
  }, [initialRequestId]);

  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    NormalizedRequest | undefined
  >(undefined);
  const [timeFilter, setTimeFilter] = useState<FilterNode>({
    request: {
      created_at: {
        gte: getTimeIntervalAgo("24h").toISOString(),
      },
    },
  });
  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);

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

  useEffect(() => {
    if (isDataLoading || !router.query.propertyFilters) {
      return;
    }
    try {
      const queryFilters = JSON.parse(
        router.query.propertyFilters as string
      ) as {
        key: string;
        value: string;
      }[];
      if (queryFilters) {
        const newFilters: UIFilterRow[] = queryFilters
          .filter(
            (filter) =>
              filterMap.findIndex((f) => f.column === filter.key) !== -1
          )
          .map((filter) => {
            const filterMapIdx = filterMap.findIndex(
              (f) => f.column === filter.key
            );
            return {
              filterMapIdx: filterMapIdx,
              operatorIdx: 0,
              value: filter.value,
            };
          });

        if (!advancedFilters || advancedFilters.length === 0) {
          setAdvancedFilters(newFilters);
          const newQuery = {
            ...router.query,
          };
          delete newQuery.propertyFilters;

          router.replace(
            {
              pathname: "/requests",
              query: newQuery,
            },
            undefined,
            {}
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [router, isDataLoading, filterMap, advancedFilters]);

  const onPageSizeChangeHandler = async (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    refetch();
  };

  const onPageChangeHandler = async (newPageNumber: number) => {
    setPage(newPageNumber);
    refetch();
  };

  const onTimeSelectHandler = (key: TimeInterval, value: string) => {
    if (key === "custom") {
      const [start, end] = value.split("_");
      const filter: FilterNode = {
        left: {
          request: {
            created_at: {
              gte: new Date(start).toISOString(),
            },
          },
        },
        operator: "and",
        right: {
          request: {
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
      request: {
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

  const onRowSelectHandler = (row: NormalizedRequest) => {
    setSelectedData(row);
    setOpen(true);
    router.push(
      {
        pathname: "/requests",
        query: { ...router.query, requestId: row.id },
      },
      undefined,
      {}
    );
  };

  return (
    <div>
      <AuthHeader
        title={isCached ? "Cached Requests" : "Requests"}
        headerActions={
          <div className="flex flex-row gap-2">
            <button
              onClick={() => refetch()}
              className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
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
            setAdvancedFilters: setAdvancedFilters,
            searchPropertyFilters: searchPropertyFilters,
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
            defaultValue: "24h",
            onTimeSelectHandler: onTimeSelectHandler,
          }}
          onRowSelect={(row) => {
            onRowSelectHandler(row);
          }}
          expandedRow={(row) => {
            return (
              <div className="flex flex-col space-y-2 border-2 p-2 my-2">
                <RequestView
                  request={row}
                  properties={[]}
                  open={true}
                  wFull={true}
                />
              </div>
            );
          }}
        />
        <TableFooter
          currentPage={currentPage}
          pageSize={pageSize}
          isCountLoading={isCountLoading}
          count={count || 0}
          onPageChange={onPageChangeHandler}
          onPageSizeChange={onPageSizeChangeHandler}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
      <RequestDrawerV2
        open={open}
        setOpen={setOpen}
        request={selectedData}
        properties={properties}
      />
    </div>
  );
};

export default RequestsPageV2;

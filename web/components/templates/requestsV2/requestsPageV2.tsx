import { ArrowPathIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HeliconeRequest } from "../../../lib/api/request/request";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useDebounce } from "../../../services/hooks/debounce";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrganizationLayout } from "../../../services/hooks/organization_layout";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  OrganizationFilter,
  OrganizationLayout,
} from "../../../services/lib/organization_layout/organization_layout";
import { placeAssetIdValues } from "../../../services/lib/requestTraverseHelper";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import { useOrg } from "../../layout/organizationContext";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import ThemedTable from "../../shared/themed/table/themedTable";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { ThemedSwitch } from "../../shared/themed/themedSwitch";
import useSearchParams from "../../shared/utils/useSearchParams";
import { TimeFilter } from "../dashboard/dashboardPage";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import {
  getModelFromPath,
  mapGeminiProJawn,
} from "./builder/mappers/geminiMapper";
import getNormalizedRequest from "./builder/requestBuilder";
import { getInitialColumns } from "./initialColumns";
import RequestCard from "./requestCard";
import RequestDrawerV2 from "./requestDrawerV2";
import TableFooter from "./tableFooter";
import useRequestsPageV2 from "./useRequestsPageV2";

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
  userId?: string;
  rateLimited?: boolean;
  currentFilter: OrganizationFilter | null;
  organizationLayout: OrganizationLayout | null;
  organizationLayoutAvailable: boolean;
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

function getTableName(isCached: boolean): string {
  return isCached ? "cache_hits" : "request";
}

const RequestsPageV2 = (props: RequestsPageV2Props) => {
  const {
    currentPage,
    pageSize,
    sort,
    isCached = false,
    initialRequestId,
    userId,
    rateLimited = false,
    currentFilter,
    organizationLayout,
    organizationLayoutAvailable,
  } = props;
  const [isLive, setIsLive] = useLocalStorage("isLive", false);
  const jawn = useJawnClient();
  const orgContext = useOrg();
  const searchParams = useSearchParams();
  const [currFilter, setCurrFilter] = useState(
    searchParams.get("filter") ?? null
  );

  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [open, setOpen] = useState(false);
  const [selectedDataIndex, setSelectedDataIndex] = useState<number>();
  const { unauthorized, currentTier } = useGetUnauthorized(userId || "");
  const [selectedData, setSelectedData] = useState<
    NormalizedRequest | undefined
  >(undefined);
  function encodeFilter(filter: UIFilterRow): string {
    return `${filterMap[filter.filterMapIdx].label}:${
      filterMap[filter.filterMapIdx].operators[filter.operatorIdx].label
    }:${filter.value}`;
  }

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

  const [timeFilter, setTimeFilter] = useState<FilterNode>(getTimeFilter());
  const [timeRange, setTimeRange] = useState<TimeFilter>(getTimeRange());

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);

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
    remove,
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

  const requestWithoutStream = requests.find((r) => {
    return (
      (r.requestBody as any)?.stream &&
      !(r.requestBody as any)?.stream_options?.include_usage &&
      r.provider === "OPENAI"
    );
  });

  const [isWarningHidden, setIsWarningHidden] = useLocalStorage("isStreamWarningHidden", false);

  useEffect(() => {
    if (initialRequestId && selectedData === undefined) {
      const fetchRequest = async () => {
        const response = await jawn.POST("/v1/request/query", {
          body: {
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
            },
            offset: 0,
            limit: 1,
            sort: {},
          },
        });

        const result = response.data;

        // update below logic to work for single request
        if (result?.data?.[0] && !result.error) {
          const request = result.data[0];

          if (request?.signed_body_url) {
            try {
              const contentResponse = await fetch(request.signed_body_url);
              if (contentResponse.ok) {
                const text = await contentResponse.text();

                let content = JSON.parse(text);

                if (request.asset_urls) {
                  content = placeAssetIdValues(request.asset_urls, content);
                }

                request.request_body = content.request;
                request.response_body = content.response;

                const model =
                  request.model_override ||
                  request.response_model ||
                  request.request_model ||
                  content.response?.model ||
                  content.request?.model ||
                  content.response?.body?.model || // anthropic
                  getModelFromPath(request.request_path) ||
                  "";

                if (
                  request.provider === "GOOGLE" &&
                  model.toLowerCase().includes("gemini")
                ) {
                  request.llmSchema = mapGeminiProJawn(
                    result.data[0] as HeliconeRequest,
                    model
                  );
                }
              }
            } catch (error) {
              console.log(`Error fetching content: ${error}`);
            }
          }

          const normalizedRequest = getNormalizedRequest(
            result.data[0] as HeliconeRequest
          );
          setSelectedData(normalizedRequest);
          setOpen(true);
        }
      };
      fetchRequest();
    }
  }, [initialRequestId]);

  useEffect(() => {
    const currentAdvancedFilters = searchParams.get("filters");

    if (
      filterMap &&
      advancedFilters.length === 0 &&
      currentAdvancedFilters &&
      !isDataLoading
    ) {
      setAdvancedFilters(getAdvancedFilters());
    }
  }, [isDataLoading]);

  //convert this using useCallback
  const getAdvancedFilters = useCallback(() => {
    function decodeFilter(encoded: string): UIFilterRow | null {
      try {
        const parts = encoded.split(":");
        if (parts.length !== 3) return null;
        const filterLabel = decodeURIComponent(parts[0]);
        const operator = decodeURIComponent(parts[1]);
        const value = decodeURIComponent(parts[2]);

        const filterMapIdx = filterMap.findIndex(
          (f) =>
            f.label.trim().toLowerCase() === filterLabel.trim().toLowerCase()
        );
        const operatorIdx = filterMap[filterMapIdx].operators.findIndex(
          (o) => o.label.trim().toLowerCase() === operator.trim().toLowerCase()
        );

        if (isNaN(filterMapIdx) || isNaN(operatorIdx)) return null;

        return { filterMapIdx, operatorIdx, value };
      } catch (error) {
        console.error("Error decoding filter:", error);
        return null;
      }
    }
    try {
      const currentAdvancedFilters = searchParams.get("filters");

      if (currentAdvancedFilters) {
        const filters = decodeURIComponent(currentAdvancedFilters).slice(1, -1);
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
  }, [searchParams, filterMap]);

  useEffect(() => {
    if (advancedFilters.length !== 0 || !userId) {
      return;
    }

    const userFilerMapIndex = filterMap.findIndex(
      (filter) => filter.label === "User"
    );

    if (userFilerMapIndex !== -1) {
      setAdvancedFilters([
        {
          filterMapIdx: userFilerMapIndex,
          operatorIdx: 0,
          value: userId,
        },
      ]);
    }
  }, [advancedFilters, filterMap, userId]);
  const userFilerMapIndex = filterMap.findIndex(
    (filter) => filter.label === "Helicone-Rate-Limit-Status"
  );
  useEffect(() => {
    if (rateLimited) {
      if (userFilerMapIndex === -1) {
        return;
      }

      setAdvancedFilters([
        {
          filterMapIdx: userFilerMapIndex,
          operatorIdx: 0,
          value: "rate_limited",
        },
      ]);
    }
  }, [userFilerMapIndex, rateLimited]);

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
        id: `${property}`,
        accessorFn: (row) => {
          const value = row.customProperties
            ? row.customProperties[property]
            : "";
          console.log("value", value);
          return value;
        },
        header: property,
        cell: (info) => {
          return info.getValue();
        },
        meta: {
          sortKey: property,
          category: "Custom Property",
        },
      };
    })
  );

  const onRowSelectHandler = (row: NormalizedRequest, index: number) => {
    setSelectedDataIndex(index);
    setSelectedData(row);
    setOpen(true);
    searchParams.set("requestId", row.id);
  };

  const {
    organizationLayout: orgLayout,
    isLoading: isOrgLayoutLoading,
    refetch: orgLayoutRefetch,
    isRefetching: isOrgLayoutRefetching,
  } = useOrganizationLayout(
    orgContext?.currentOrg?.id!,
    "requests",
    organizationLayout
      ? {
          data: organizationLayout,
          error: null,
        }
      : undefined
  );

  const onSetAdvancedFiltersHandler = (
    filters: UIFilterRow[],
    layoutFilterId?: string | null
  ) => {
    setAdvancedFilters(filters);
    if (layoutFilterId === null || filters.length === 0) {
      searchParams.delete("filters");
    } else {
      const currentAdvancedFilters = filters.map(encodeFilter).join("|");

      searchParams.set(
        "filters",
        `"${encodeURIComponent(currentAdvancedFilters)}"`
      );
    }
  };

  const onLayoutFilterChange = (layoutFilter: OrganizationFilter | null) => {
    if (layoutFilter !== null) {
      onSetAdvancedFiltersHandler(layoutFilter?.filter, layoutFilter.id);
      setCurrFilter(layoutFilter?.id);
    } else {
      setCurrFilter(null);
      onSetAdvancedFiltersHandler([], null);
    }
  };

  const renderUnauthorized = () => {
    if (currentTier === "free") {
      return (
        <div className="flex flex-col w-full h-[80vh] justify-center items-center">
          <div className="flex flex-col w-2/5">
            <HomeIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
            <p className="text-xl text-black dark:text-white font-semibold mt-8">
              You have reached your monthly limit.
            </p>
            <p className="text-sm text-gray-500 max-w-sm mt-2">
              Upgrade your plan to view your request page. Your requests are
              still being processed, but you will not be able to view them until
              you upgrade.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setOpen(true);
                }}
                className="items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (currentTier === "pro") {
      return (
        <div className="flex flex-col w-full h-[80vh] justify-center items-center">
          <div className="flex flex-col w-full">
            <HomeIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
            <p className="text-xl text-black dark:text-white font-semibold mt-8">
              You have reached your monthly limit on the Pro plan.
            </p>
            <p className="text-sm text-gray-500 max-w-sm mt-2">
              Please get in touch with us to discuss increasing your limits.
            </p>
            <div className="mt-4">
              <Link
                href="https://cal.com/team/helicone/helicone-discovery"
                target="_blank"
                rel="noreferrer"
                className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div>
      {requestWithoutStream && !isWarningHidden && (
        <div className="alert alert-warning flex justify-between items-center">
          <p className="text-yellow-800">
            We are unable to calculate your cost accurately because the
            &#39;stream_usage&#39; option is not included in your message.
            Please refer to{" "}
            <a
              href="https://docs.helicone.ai/use-cases/enable-stream-usage"
              className="text-blue-600 underline"
            >
              this documentation
            </a>{" "}
            for more information.
          </p>
          <button
            onClick={() => setIsWarningHidden(true)}
            className="text-yellow-800 hover:text-yellow-900"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
      {!isCached && userId === undefined && (
        <AuthHeader
          title={isCached ? "Cached Requests" : "Requests"}
          headerActions={
            <div className="flex flex-row gap-2">
              <button
                onClick={() => {
                  remove();
                  refetch();
                }}
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
              <ThemedSwitch
                checked={isLive}
                onChange={setIsLive}
                label="Live"
              />
            </>
          }
        />
      )}
      {unauthorized ? (
        <>{renderUnauthorized()}</>
      ) : (
        <div className="flex flex-col space-y-4">
          <ThemedTable
            id="requests-table"
            defaultData={requests || []}
            defaultColumns={columnsWithProperties}
            dataLoading={isDataLoading}
            sortable={sort}
            advancedFilters={{
              filterMap: filterMap,
              filters: advancedFilters,
              setAdvancedFilters: onSetAdvancedFiltersHandler,
              searchPropertyFilters: searchPropertyFilters,
              show: userId ? false : true,
            }}
            savedFilters={
              organizationLayoutAvailable
                ? {
                    currentFilter: currFilter ?? undefined,
                    filters: orgLayout?.data?.filters ?? undefined,
                    onFilterChange: onLayoutFilterChange,
                    onSaveFilterCallback: async () => {
                      await orgLayoutRefetch();
                    },
                    layoutPage: "requests",
                  }
                : undefined
            }
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
            makeCard={
              userId
                ? undefined
                : (row) => {
                    return (
                      <RequestCard request={row} properties={properties} />
                    );
                  }
            }
            makeRow={
              userId
                ? undefined
                : {
                    properties: properties,
                  }
            }
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
      )}
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
    </div>
  );
};

export default RequestsPageV2;

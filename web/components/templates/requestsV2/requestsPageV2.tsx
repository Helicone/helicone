import { ArrowPathIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeliconeRequest } from "../../../lib/api/request/request";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useDebounce } from "../../../services/hooks/debounce";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrganizationLayout } from "../../../services/hooks/organization_layout";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  OrganizationFilter,
  OrganizationLayout,
  transformFilter,
  transformOrganizationLayoutFilters,
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
import {
  getRootFilterNode,
  isFilterRowNode,
  isUIFilterRow,
  UIFilterRowNode,
  UIFilterRowTree,
} from "../../../services/lib/filters/uiFilterRowTree";

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

function formatDateForClickHouse(date: Date): string {
  return date.toISOString();
}

function getTimeIntervalAgo(interval: TimeInterval): Date {
  const now = new Date();

  switch (interval) {
    case "3m":
      return new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
    case "1m":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000);
    case "all":
      return new Date(0);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24h
  }
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
  return isCached ? "cache_hits" : "request_response_versioned";
}

function getCreatedAtColumn(isCached: boolean): string {
  return isCached ? "created_at" : "request_created_at";
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
  const initialLoadRef = useRef(true);
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

  const encodeFilters = (filters: UIFilterRowTree): string => {
    const encode = (node: UIFilterRowTree): any => {
      if (isFilterRowNode(node)) {
        return {
          type: "node",
          operator: node.operator,
          rows: node.rows.map(encode),
        };
      } else {
        return {
          type: "leaf",
          filter: `${filterMap[node.filterMapIdx].label}:${
            filterMap[node.filterMapIdx].operators[node.operatorIdx].label
          }:${encodeURIComponent(node.value)}`,
        };
      }
    };

    return JSON.stringify(encode(filters));
  };

  const getTimeFilter = () => {
    const currentTimeFilter = searchParams.get("t");
    const tableName = getTableName(isCached);
    const createdAtColumn = getCreatedAtColumn(isCached);

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const [_, start, end] = currentTimeFilter.split("_");

      const filter: FilterNode = {
        left: {
          [tableName]: {
            [createdAtColumn]: {
              gte: formatDateForClickHouse(new Date(start)),
            },
          },
        },
        operator: "and",
        right: {
          [tableName]: {
            [createdAtColumn]: {
              lte: formatDateForClickHouse(new Date(end)),
            },
          },
        },
      };
      return filter;
    } else {
      const timeIntervalDate = getTimeIntervalAgo(
        (currentTimeFilter as TimeInterval) || "24h"
      );
      return {
        [tableName]: {
          [createdAtColumn]: {
            gte: formatDateForClickHouse(timeIntervalDate),
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

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );

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

  const [isWarningHidden, setIsWarningHidden] = useLocalStorage(
    "isStreamWarningHidden",
    false
  );

  useEffect(() => {
    if (initialRequestId && selectedData === undefined) {
      const fetchRequest = async () => {
        const response = await jawn.POST("/v1/request/queryV2", {
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

  //convert this using useCallback

  // TODO fix this to return correct UIFilterRowTree instead of UIFilterRow[]
  const getAdvancedFilters = useCallback((): UIFilterRowTree => {
    const decodeFilter = (encoded: any): UIFilterRowTree => {
      if (encoded.type === "node") {
        return {
          operator: encoded.operator as "and" | "or",
          rows: encoded.rows.map(decodeFilter),
        };
      } else {
        const [filterLabel, operator, value] = encoded.filter.split(":");
        const filterMapIdx = filterMap.findIndex(
          (f) =>
            f.label.trim().toLowerCase() === filterLabel.trim().toLowerCase()
        );
        const operatorIdx = filterMap[filterMapIdx]?.operators.findIndex(
          (o) => o.label.trim().toLowerCase() === operator.trim().toLowerCase()
        );

        if (
          isNaN(filterMapIdx) ||
          isNaN(operatorIdx) ||
          filterMapIdx === -1 ||
          operatorIdx === -1
        ) {
          console.log("Invalid filter map or operator index", {
            filterLabel,
            operator,
          });
          return getRootFilterNode();
        }

        return {
          filterMapIdx,
          operatorIdx,
          value: decodeURIComponent(value),
        };
      }
    };

    try {
      const currentAdvancedFilters = searchParams.get("filters");

      if (currentAdvancedFilters) {
        const filters = decodeURIComponent(currentAdvancedFilters).replace(
          /^"|"$/g,
          ""
        );

        const parsedFilters = JSON.parse(filters);
        const result = decodeFilter(parsedFilters);
        return result;
      }
    } catch (error) {
      console.error("Error decoding advanced filters:", error);
    }

    return getRootFilterNode();
  }, [searchParams, filterMap]);

  useEffect(() => {
    if (initialLoadRef.current && filterMap.length > 0 && !isDataLoading) {
      const loadedFilters = getAdvancedFilters();
      setAdvancedFilters(loadedFilters);
      initialLoadRef.current = false;
    }
  }, [filterMap, getAdvancedFilters]);

  // TODO
  useEffect(() => {
    if (
      !isFilterRowNode(advancedFilters) ||
      advancedFilters.rows.length === 0
    ) {
      if (userId) {
        const userFilterMapIndex = filterMap.findIndex(
          (filter) => filter.label === "User"
        );

        if (userFilterMapIndex !== -1) {
          setAdvancedFilters({
            operator: "and",
            rows: [
              {
                filterMapIdx: userFilterMapIndex,
                operatorIdx: 0,
                value: userId,
              },
            ],
          } as UIFilterRowNode);
        }
      }
    }
  }, [advancedFilters, filterMap, userId]);
  const userFilterMapIndex = filterMap.findIndex(
    (filter) => filter.label === "Helicone-Rate-Limit-Status"
  );
  const rateLimitFilterMapIndex = filterMap.findIndex(
    (filter) => filter.label === "Helicone-Rate-Limit-Status"
  );
  // TODO
  useEffect(() => {
    if (rateLimited) {
      if (userFilterMapIndex === -1) {
        return;
      }

      setAdvancedFilters((prev) => {
        const newFilter: UIFilterRow = {
          filterMapIdx: userFilterMapIndex,
          operatorIdx: 0,
          value: "rate_limited",
        };

        if (isFilterRowNode(prev)) {
          // Check if the rate limit filter already exists
          const existingFilterIndex = prev.rows.findIndex(
            (row) =>
              isUIFilterRow(row) && row.filterMapIdx === userFilterMapIndex
          );

          if (existingFilterIndex !== -1) {
            // Update existing filter
            const updatedRows = [...prev.rows];
            updatedRows[existingFilterIndex] = newFilter;
            return { ...prev, rows: updatedRows };
          } else {
            // Add new filter
            return { ...prev, rows: [...prev.rows, newFilter] };
          }
        } else {
          // If prev is a single UIFilterRow, create a new UIFilterRowNode
          return {
            operator: "and",
            rows: [prev, newFilter],
          };
        }
      });
    }
  }, [userFilterMapIndex, rateLimited, setAdvancedFilters]);
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
    const createdAtColumn = getCreatedAtColumn(isCached);
    if (key === "custom") {
      const [start, end] = value.split("_");
      const filter: FilterNode = {
        left: {
          [tableName]: {
            [createdAtColumn]: {
              gte: formatDateForClickHouse(new Date(start)),
            },
          },
        },
        operator: "and",
        right: {
          [tableName]: {
            [createdAtColumn]: {
              lte: formatDateForClickHouse(new Date(end)),
            },
          },
        },
      };
      setTimeFilter(filter);
      return;
    }

    setTimeFilter({
      [tableName]: {
        [createdAtColumn]: {
          gte: formatDateForClickHouse(getTimeIntervalAgo(key)),
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

  const onSetAdvancedFiltersHandler = useCallback(
    (filters: UIFilterRowTree, layoutFilterId?: string | null) => {
      setAdvancedFilters(filters);
      if (
        layoutFilterId === null ||
        (isFilterRowNode(filters) && filters.rows.length === 0)
      ) {
        searchParams.delete("filters");
      } else {
        const currentAdvancedFilters = encodeFilters(filters);
        searchParams.set("filters", currentAdvancedFilters);
      }
    },
    [searchParams]
  );

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

  const transformedFilters = useMemo(() => {
    if (orgLayout?.data?.filters) {
      return transformOrganizationLayoutFilters(orgLayout.data.filters);
    }
    return [];
  }, [orgLayout?.data?.filters]);

  const onLayoutFilterChange = (layoutFilter: OrganizationFilter | null) => {
    if (layoutFilter !== null) {
      const transformedFilter = transformFilter(layoutFilter.filter[0]);
      onSetAdvancedFiltersHandler(transformedFilter, layoutFilter.id);
      setCurrFilter(layoutFilter.id);
    } else {
      setCurrFilter(null);
      onSetAdvancedFiltersHandler({ operator: "and", rows: [] }, null);
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
                    filters:
                      transformedFilters && orgLayout?.data?.id
                        ? transformedFilters
                        : undefined,
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

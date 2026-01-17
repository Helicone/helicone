import { Row } from "@/components/layout/common";
import Header from "@/components/shared/Header";
import LivePill from "@/components/shared/LivePill";
import { logger } from "@/lib/telemetry/logger";
import ViewColumns from "@/components/shared/themed/table/columns/viewColumns";
import ThemedTimeFilter from "@/components/shared/themed/themedTimeFilter";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FilterASTButton from "@/filterAST/FilterASTButton";
import { useFilterAST } from "@/filterAST/context/filterContext";
import {
  HeliconeRequest,
  MappedLLMRequest,
} from "@helicone-package/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { useGetRequestWithBodies } from "@/services/hooks/requests";
import {
  UIFilterRowNode,
  UIFilterRowTree,
} from "@helicone-package/filters/types";
import { TimeFilter } from "@/types/timeFilter";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useSelectMode } from "../../../services/hooks/dataset/selectMode";
import { useDebounce } from "../../../services/hooks/debounce";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { getRootFilterNode } from "@helicone-package/filters/helpers";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import GenericButton from "../../layout/common/button";
import { useOrg } from "../../layout/org/organizationContext";
import {
  DragColumnItem,
  columnDefToDragColumnItem,
} from "../../shared/themed/table/columns/DragList";
import ExportButton from "../../shared/themed/table/exportButton";
import ThemedTable from "../../shared/themed/table/themedTable";
import ThemedModal from "../../shared/themed/themedModal";
import useSearchParams from "../../shared/utils/useSearchParams";
import NewDataset from "../datasets/NewDataset";
import { getInitialColumns } from "./initialColumns";
import {
  getMockFilterMap,
  getMockProperties,
  getMockRequestCount,
  getMockRequests,
} from "./mockRequestsData";
import RequestDrawer from "./RequestDrawer";
import RequestsEmptyState, {
  EMPTY_STATE_PAGES,
  RequestsPageEmptyStateOptions,
} from "./RequestsEmptyState";
import StreamWarning from "./StreamWarning";
import TableFooter from "./tableFooter";
import UnauthorizedView from "./UnauthorizedView";
import useRequestsPageV2 from "./useRequestsPageV2";
import { useHeliconeAgent } from "../agent/HeliconeAgentContext";
import { useFilterUIDefinitions } from "@/filterAST/filterUIDefinitions/useFilterUIDefinitions";
import { FilterUIDefinition } from "@/filterAST/filterUIDefinitions/types";
import { FilterAST } from "@/filterAST/filterAst";
import { GET_FILTER_ARGS_TOOL_CONTEXT } from "@/lib/agent/tools";

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
  evaluatorId?: string;
  rateLimited?: boolean;
  organizationLayoutAvailable: boolean;
  emptyStateOptions?: RequestsPageEmptyStateOptions;
  showSelection?: boolean;
}

type TRequest = {
  id: string;
  metadata: MappedLLMRequest;
};

export default function RequestsPage(props: RequestsPageV2Props) {
  const {
    currentPage,
    pageSize,
    sort,
    isCached = false,
    initialRequestId,
    userId,
    rateLimited = false,
    emptyStateOptions = {
      options: EMPTY_STATE_PAGES.requests,
      isVisible: true,
    },
    showSelection = true,
  } = props;

  /* -------------------------------------------------------------------------- */
  /*                                    REFS                                    */
  /* -------------------------------------------------------------------------- */
  const initialLoadRef = useRef(true);
  const drawerRef = useRef<any>(null);
  const tableRef = useRef<any>(null);

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    MappedLLMRequest | undefined
  >(undefined);

  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [selectedDataIndex, setSelectedDataIndex] = useState<number>();
  const [page, setPage] = useState<number>(currentPage);
  const [advancedFilters, setAdvancedFilters] =
    useState<UIFilterRowTree>(getRootFilterNode());

  // TODO: Is this efficient?
  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  /* -------------------------------------------------------------------------- */
  /*                                    HOOKS                                   */
  /* -------------------------------------------------------------------------- */
  const orgContext = useOrg();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { store: filterStore, helpers: filterHelpers } = useFilterAST();
  const [drawerSize, setDrawerSize] = useLocalStorage(
    "request-drawer-size",
    initialRequestId ? 33 : 0,
  );
  const [isLive, setIsLive] = useLocalStorage("isLive-RequestPage", false);
  const { unauthorized, currentTier } = useGetUnauthorized(userId || "");
  const initialRequest = useGetRequestWithBodies(initialRequestId || "");

  const cacheFilter: FilterNode = isCached
    ? {
      request_response_rmt: {
        cache_enabled: {
          equals: true,
        },
      },
    }
    : "all";

  // filter when custom is not selected
  const defaultFilter = useMemo<FilterNode>(() => {
    const currentTimeFilter = searchParams.get("t");
    const timeIntervalDate = getTimeIntervalAgo(
      (currentTimeFilter as TimeInterval) || "1m",
    );
    return {
      left: {
        request_response_rmt: {
          request_created_at: {
            gte: new Date(timeIntervalDate),
          },
        },
      },
      operator: "and",
      right: cacheFilter,
    };
  }, [cacheFilter]);

  // TODO: Move this to a better place or turn into callback
  const getTimeFilter = () => {
    const currentTimeFilter = searchParams.get("t");

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const [_, start, end] = currentTimeFilter.split("_");

      // When live mode is on, don't set an upper bound so new data can appear
      if (isLive) {
        const filter: FilterNode = {
          left: {
            request_response_rmt: {
              request_created_at: {
                gte: new Date(start),
              },
            },
          },
          operator: "and",
          right: cacheFilter,
        };
        return filter;
      } else {
        const filter: FilterNode = {
          left: {
            request_response_rmt: {
              request_created_at: {
                gte: new Date(start),
              },
            },
          },
          operator: "and",
          right: {
            left: {
              request_response_rmt: {
                request_created_at: {
                  lte: new Date(end),
                },
              },
            },
            operator: "and",
            right: cacheFilter,
          },
        };
        return filter;
      }
    } else {
      return defaultFilter;
    }
  };
  const getTimeRange = () => {
    const currentTimeFilter = searchParams.get("t");
    let range: TimeFilter;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("1m");
      const end = new Date(currentTimeFilter.split("_")[2] || new Date());
      range = {
        start,
        end,
      };
    } else {
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "1m"),
        end: new Date(),
      };
    }
    return range;
  };
  const [timeFilter, setTimeFilter] = useState<FilterNode>(getTimeFilter());

  // TODO: Should this ever use states?
  const sortLeaf: SortLeafRequest = getSortLeaf(
    sort.sortKey,
    sort.sortDirection,
    sort.isCustomProperty,
  );
  const {
    count: realCount,
    isDataLoading: realIsDataLoading,
    isBodyLoading: realIsBodyLoading,
    isCountLoading: realIsCountLoading,
    isRefetching: realIsRefetching,
    requests: realRequests,
    properties: realProperties,
    refetch: realRefetch,
    filterMap: realFilterMap,
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
    isLive,
    rateLimited,
  );

  const { setToolHandler } = useHeliconeAgent();
  const { filterDefinitions } = useFilterUIDefinitions();

  const [allowedFilterDefinitions, setAllowedFilterDefinitions] = useState<
    FilterUIDefinition[] | null
  >(null);

  useEffect(() => {
    if (allowedFilterDefinitions || filterDefinitions.length === 0) return;
    setAllowedFilterDefinitions(filterDefinitions);
  }, [filterDefinitions]);

  const { helpers } = useFilterAST();
  useEffect(() => {
    setToolHandler("get-filter-args", async () => {
      const filterDefs = allowedFilterDefinitions?.filter(
        (def) => def.table === "request_response_rmt",
      );

      const EXTRA_CONTEXT = `
      The following are the filter definitions for the requests page:
      ${JSON.stringify(filterDefs)}
      ${GET_FILTER_ARGS_TOOL_CONTEXT}
      `;

      return {
        success: true,
        message: EXTRA_CONTEXT,
      };
    });

    setToolHandler("set-filters", async (args: { filter: any }) => {
      try {
        const filterNode =
          typeof args.filter === "string"
            ? JSON.parse(args.filter)
            : args.filter;
        filterStore.setFilter(FilterAST.and(filterNode));
        return {
          success: true,
          message: "Filters set successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to parse filters: ${error}`,
        };
      }
    });
    setToolHandler("save-current-filter", async () => {
      helpers.saveFilter();
      return {
        success: true,
        message: "Filter saved successfully",
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedFilterDefinitions]);

  /* -------------------------------------------------------------------------- */
  /*                                    MEMOS                                   */
  /* -------------------------------------------------------------------------- */
  const shouldShowMockData = useMemo(() => {
    const showMockData = emptyStateOptions.isVisible === true;

    if (orgContext?.currentOrg === undefined) {
      return undefined;
    }
    return orgContext?.currentOrg?.has_onboarded === false && showMockData;
  }, [orgContext?.currentOrg]);

  const mockRequests = useMemo(() => {
    const shouldForceRateLimitMock =
      emptyStateOptions?.options === EMPTY_STATE_PAGES["rate-limits"];

    return getMockRequests(
      pageSize,
      shouldForceRateLimitMock ? 429 : undefined,
    );
  }, [pageSize, emptyStateOptions]);

  const mockFilterMap = useMemo(() => getMockFilterMap(), []);
  const mockProperties = useMemo(() => getMockProperties(), []);
  const mockCount = useMemo(() => getMockRequestCount(), []);
  const timeRange = useMemo(getTimeRange, [searchParams]);

  const count = shouldShowMockData ? mockCount : realCount;
  const isDataLoading = shouldShowMockData ? false : realIsDataLoading;
  const isBodyLoading = shouldShowMockData ? false : realIsBodyLoading;
  const isCountLoading = shouldShowMockData ? false : realIsCountLoading;
  const isRefetching = shouldShowMockData ? false : realIsRefetching;
  const requests = shouldShowMockData ? mockRequests : realRequests;
  const properties = shouldShowMockData ? mockProperties : realProperties;
  const refetch = shouldShowMockData ? () => { } : realRefetch;
  const filterMap = shouldShowMockData ? (mockFilterMap as any) : realFilterMap;

  // Moved activeColumns state management here
  const [activeColumns, setActiveColumns] = useLocalStorage<DragColumnItem[]>(
    `requests-table-activeColumns`, // Use a unique key
    getInitialColumns().map(columnDefToDragColumnItem), // Initialize with default columns
  );

  const columnsWithProperties = useMemo(() => {
    const initialColumns = getInitialColumns();
    return [...initialColumns].concat(
      properties.map((property) => {
        return {
          id: initialColumns.find((column) => column.id === property) // on id conflict, append property- to the property
            ? `property-${property}`
            : `${property}`,
          accessorFn: (row) => {
            const value = row.heliconeMetadata.customProperties
              ? row.heliconeMetadata.customProperties[property]
              : "";
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
      }),
    );
  }, [properties, isCached]);

  const {
    selectMode,
    selectedIds,
    toggleSelection,
    selectAll,
    isShiftPressed,
  } = useSelectMode<TRequest>({
    items: requests.map((request, index) => ({
      id: index.toString(),
      metadata: request,
    })),
    getItemId: (request) => request.id,
  });

  const requestWithoutStream = requests.find((r) => {
    return (
      r.raw?.request?.stream &&
      !r.raw?.request?.stream_options?.include_usage &&
      r.heliconeMetadata.provider === "OPENAI"
    );
  });

  const selectedRequests = useMemo(() => {
    return requests.filter((_, index) =>
      selectedIds.includes(index.toString()),
    );
  }, [requests, selectedIds]);

  const hasActiveFilters = useMemo(() => {
    return filterStore.filter !== null && filterStore.getFilterNodeCount() > 0;
  }, [filterStore.filter, filterStore.getFilterNodeCount]);

  const shouldShowClearFilters = useMemo(() => {
    return (
      shouldShowMockData === false &&
      requests.length === 0 &&
      !isDataLoading &&
      hasActiveFilters
    );
  }, [shouldShowMockData, requests.length, isDataLoading, hasActiveFilters]);

  /* -------------------------------------------------------------------------- */
  /*                                  CALLBACKS                                 */
  /* -------------------------------------------------------------------------- */
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
          (f: any) =>
            f.label.trim().toLowerCase() === filterLabel.trim().toLowerCase(),
        );
        const operatorIdx = filterMap[filterMapIdx]?.operators.findIndex(
          (o: any) =>
            o.label.trim().toLowerCase() === operator.trim().toLowerCase(),
        );

        if (
          isNaN(filterMapIdx) ||
          isNaN(operatorIdx) ||
          filterMapIdx === -1 ||
          operatorIdx === -1
        ) {
          logger.warn(
            {
              filterLabel,
              operator,
            },
            "Invalid filter map or operator index",
          );
          return getRootFilterNode();
        }

        return {
          filterMapIdx,
          operatorIdx,
          value: value,
        };
      }
    };

    try {
      const currentAdvancedFilters = searchParams.get("filters");

      if (currentAdvancedFilters) {
        const filters = decodeURIComponent(currentAdvancedFilters).replace(
          /^"|"$/g,
          "",
        );

        const parsedFilters = JSON.parse(filters);
        const result = decodeFilter(parsedFilters);
        return result;
      }
    } catch (error) {
      logger.error(
        {
          error,
        },
        "Error decoding advanced filters",
      );
    }

    return getRootFilterNode();
  }, [searchParams, filterMap]);

  // Update the page state and router query when the page changes
  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: newPage.toString() },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const onTimeSelectHandler = useCallback(
    (key: TimeInterval, value: string) => {
      if (key === "custom") {
        const [start, end] = value.split("_");
        // When live mode is on, don't set an upper bound so new data can appear
        if (isLive) {
          const filter: FilterNode = {
            left: {
              request_response_rmt: {
                request_created_at: {
                  gte: new Date(start),
                },
              },
            },
            operator: "and",
            right: cacheFilter,
          };
          setTimeFilter(filter);
        } else {
          const filter: FilterNode = {
            left: {
              request_response_rmt: {
                request_created_at: {
                  gte: new Date(start),
                },
              },
            },
            operator: "and",
            right: {
              left: {
                request_response_rmt: {
                  request_created_at: {
                    lte: new Date(end),
                  },
                },
              },
              operator: "and",
              right: cacheFilter,
            },
          };
          setTimeFilter(filter);
        }
      } else {
        setTimeFilter({
          request_response_rmt: {
            request_created_at: {
              gte: new Date(getTimeIntervalAgo(key)),
            },
          },
        });
      }
    },
    [isCached, isLive, setTimeFilter],
  );

  // if shift is pressed, we select the rows in the highlighted range
  // if metakey is pressed, we add the row to the selection
  // if click was on a checkbox, we add the row to the selection
  // else we open the side-tray with details on the request.
  const onRowSelectHandler = useCallback(
    (row: MappedLLMRequest, index: number, event?: React.MouseEvent) => {
      // bit of a hack since pre-existing table behavior is noop
      let isCheckboxClick =
        event?.target instanceof HTMLElement &&
        (event.target.tagName.toLowerCase() === "button" ||
          event.target.closest("button") !== null);
      if (isShiftPressed || event?.metaKey || isCheckboxClick) {
        toggleSelection({
          id: index.toString(),
          metadata: row,
        });
        return;
      } else {
        setSelectedDataIndex(index);
        setSelectedData(row);
        drawerRef.current?.expand(); // Expand the drawer
        searchParams.set("requestId", row.heliconeMetadata.requestId);
      }
    },
    [
      isShiftPressed,
      toggleSelection,
      setSelectedDataIndex,
      setSelectedData,
      searchParams,
    ],
  );

  const getDefaultValue = useCallback(() => {
    const currentTimeFilter = searchParams.get("t");

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  }, [searchParams]);

  /* -------------------------------------------------------------------------- */
  /*                                   EFFECTS                                  */
  /* -------------------------------------------------------------------------- */
  // When isLive changes, re-apply the time filter to add/remove upper bound
  useEffect(() => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const [, start, end] = currentTimeFilter.split("_");
      onTimeSelectHandler("custom" as TimeInterval, `${start}_${end}`);
    }
  }, [isLive]);

  // Synchronize page state from URL query parameters
  useEffect(() => {
    const pageFromQuery = router.query.page;
    if (pageFromQuery && !Array.isArray(pageFromQuery)) {
      const parsedPage = parseInt(pageFromQuery, 10);
      if (!isNaN(parsedPage) && parsedPage !== page) {
        setPage(parsedPage);
      }
    }
  }, [router.query.page]);

  // Initialize advanced filters from URL on first load
  const userFilterAppliedRef = useRef(false);
  useEffect(() => {
    if (userId && !userFilterAppliedRef.current) {
      const userFilterMapIndex = filterMap.findIndex(
        (filter: any) => filter.label === "User",
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
      userFilterAppliedRef.current = true;
    } else if (
      initialLoadRef.current &&
      filterMap.length > 0 &&
      !isDataLoading &&
      !userId
    ) {
      const loadedFilters = getAdvancedFilters();
      setAdvancedFilters(loadedFilters);
      initialLoadRef.current = false;
    }
  }, [filterMap, getAdvancedFilters, isDataLoading, userId]);

  // Load and display initial request data in drawer
  useEffect(() => {
    if (initialRequest.data?.data && !selectedData) {
      setSelectedData(
        heliconeRequestToMappedContent(
          initialRequest.data.data as HeliconeRequest,
        ),
      );
      drawerRef.current?.expand(); // Expand the drawer
      drawerRef.current?.resize(drawerSize);
    }
  }, [initialRequest, selectedData, drawerSize]);

  return shouldShowMockData === undefined ? null : shouldShowMockData ===
    false ? (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      {/* Requests Header */}
      {/* Warning */}
      {!userId && (
        <div
          className={
            "align-center flex flex-col items-center justify-center text-center"
          }
        >
          <StreamWarning
            requestWithStreamUsage={requestWithoutStream !== undefined}
          />
        </div>
      )}
      {/* Header */}
      {!userId && (
        <Header
          title={isCached ? "Cached Requests" : "Requests"}
          leftActions={
            <div className="flex flex-row items-center gap-2">
              {/* Time Filter */}
              <ThemedTimeFilter
                currentTimeFilter={getTimeRange()}
                timeFilterOptions={[]}
                onSelect={function (key: string, value: string): void {
                  onTimeSelectHandler(key as TimeInterval, value);
                }}
                isFetching={false}
                defaultValue={getDefaultValue()}
                custom={true}
                isLive={isLive}
                hasCustomTimeFilter={
                  searchParams.get("t")?.startsWith("custom_") || false
                }
                onClearTimeFilter={() => {
                  searchParams.delete("t");
                  setTimeFilter(defaultFilter);
                }}
              />

              {/* Filter AST Button */}
              <FilterASTButton showCurlButton={true} />
            </div>
          }
          rightActions={
            <div className="flex items-center gap-2">
              {/* Add to dataset button - only shows when items are selected */}
              {selectedIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-row gap-2 bg-sky-50 text-xs text-sky-600 hover:bg-sky-100 hover:text-sky-700"
                  onClick={() => {
                    setModalOpen(true);
                  }}
                >
                  <LuPlus className="h-4 w-4" />
                  Add to Dataset
                </Button>
              )}

              <div className="gpa-0 flex flex-row">
                {/* Columns Configuration Button */}
                <ViewColumns
                  columns={tableRef.current?.getAllColumns() || []}
                  activeColumns={activeColumns}
                  setActiveColumns={setActiveColumns}
                />

                {/* Export button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ExportButton
                      rows={
                        selectedRequests.length > 0
                          ? selectedRequests
                          : requests
                      }
                    />
                  </TooltipTrigger>
                  <TooltipContent>Export data</TooltipContent>
                </Tooltip>
              </div>

              {/* Live pill */}
              <LivePill
                isLive={isLive}
                setIsLive={setIsLive}
                isDataLoading={isDataLoading}
                isRefetching={isRefetching}
                refetch={refetch}
              />
            </div>
          }
        />
      )}
      <ResizablePanelGroup direction="horizontal">
        {/* Requests Table */}
        <ResizablePanel>
          {/* Requests Table */}
          {unauthorized ? (
            <UnauthorizedView currentTier={currentTier || ""} />
          ) : (
            <ThemedTable
              id="requests-table"
              tableRef={tableRef}
              activeColumns={activeColumns}
              setActiveColumns={setActiveColumns}
              checkboxMode={showSelection ? "on_hover" : "never"}
              defaultData={requests}
              defaultColumns={columnsWithProperties}
              skeletonLoading={isDataLoading}
              dataLoading={isBodyLoading}
              sortable={sort}
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
              timeFilter={
                !userId
                  ? {
                    currentTimeFilter: timeRange,
                    defaultValue: "1m",
                    onTimeSelectHandler: onTimeSelectHandler,
                  }
                  : undefined
              }
              onRowSelect={onRowSelectHandler}
              onSelectAll={showSelection ? selectAll : undefined}
              selectedIds={selectedIds}
              // only for request page
              currentRow={selectedData}
              showClearFilters={shouldShowClearFilters}
              onClearFilters={() => {
                filterHelpers.clearFilter();
              }}
            >
              {selectMode && (
                <Row className="w-full items-center justify-between gap-5 bg-white p-5 dark:bg-black">
                  <div className="flex flex-row items-center gap-2">
                    <span className="whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      Request Selection:
                    </span>
                    <span className="whitespace-nowrap rounded-md bg-[#F1F5F9] p-2 text-sm font-medium text-[#1876D2] dark:bg-slate-900 dark:text-slate-100">
                      {selectedIds.length} selected
                    </span>
                  </div>
                  {selectedIds.length > 0 && (
                    <GenericButton
                      onClick={() => {
                        setModalOpen(true);
                      }}
                      icon={
                        <LuPlus className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                      }
                      text="Add to dataset"
                    />
                  )}
                </Row>
              )}
            </ThemedTable>
          )}
        </ResizablePanel>

        <ResizableHandle />

        {/* Request Drawer */}
        <ResizablePanel
          ref={drawerRef}
          defaultSize={0}
          minSize={33}
          onResize={(size) => {
            if (size > 0) {
              setDrawerSize(size);
            }
          }}
          onExpand={() => {
            drawerRef.current?.resize(drawerSize);
          }}
          collapsible={true}
        >
          <RequestDrawer
            request={selectedData}
            onCollapse={() => {
              drawerRef.current?.collapse();
            }}
            onNavigate={(direction) => {
              if (direction === "prev") {
                if (selectedDataIndex !== undefined && selectedDataIndex > 0) {
                  setSelectedDataIndex(selectedDataIndex - 1);
                  setSelectedData(requests[selectedDataIndex - 1]);
                  searchParams.set(
                    "requestId",
                    requests[selectedDataIndex - 1].id,
                  );
                }
              } else if (direction === "next") {
                if (
                  selectedDataIndex !== undefined &&
                  selectedDataIndex < requests.length - 1
                ) {
                  setSelectedDataIndex(selectedDataIndex + 1);
                  setSelectedData(requests[selectedDataIndex + 1]);
                  searchParams.set(
                    "requestId",
                    requests[selectedDataIndex + 1].id,
                  );
                }
              }
            }}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Table Footer */}
      <TableFooter
        currentPage={page}
        pageSize={currentPageSize}
        isCountLoading={isCountLoading}
        count={count || 0}
        onPageChange={(n) => handlePageChange(n)}
        onPageSizeChange={(n) => {
          setCurrentPageSize(n);
          setPage(1); // Reset to page 1 when page size changes
        }}
        pageSizeOptions={[25, 50, 100, 250, 500]}
      />

      {/* Floating Elements */}
      <ThemedModal open={modalOpen} setOpen={setModalOpen}>
        <NewDataset
          request_ids={selectedRequests.map((request) => request.id)}
          onComplete={() => {
            setModalOpen(false);
          }}
        />
      </ThemedModal>
    </main>
  ) : (
    <div className="animate-fade-in">
      <RequestsEmptyState
        isVisible={emptyStateOptions.isVisible ?? true}
        options={emptyStateOptions.options}
        onClickHandler={emptyStateOptions.onPrimaryActionClick}
      />

      <ThemedTable
        id="requests-table"
        defaultData={requests}
        activeColumns={activeColumns}
        setActiveColumns={setActiveColumns}
        defaultColumns={columnsWithProperties}
        skeletonLoading={false}
        dataLoading={false}
        hideHeader={true}
        checkboxMode={"never"}
      />
    </div>
  );
}

// TODO: Move these to util files or remove the need for them?
function getTimeIntervalAgo(interval: TimeInterval): Date {
  const now = new Date();
  const utcNow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
  );

  switch (interval) {
    case "3m":
      return new Date(utcNow - 3 * 30 * 24 * 60 * 60 * 1000);
    case "1m":
      return new Date(utcNow - 30 * 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(utcNow - 7 * 24 * 60 * 60 * 1000);
    case "24h":
      return new Date(utcNow - 24 * 60 * 60 * 1000);
    case "1h":
      return new Date(utcNow - 60 * 60 * 1000);
    case "all":
      return new Date(0);
    default:
      return new Date(utcNow - 24 * 60 * 60 * 1000); // Default to 24h
  }
}
function getSortLeaf(
  sortKey: string | null,
  sortDirection: SortDirection | null,
  isCustomProperty: boolean,
): SortLeafRequest {
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
  } else {
    return {
      created_at: "desc",
    };
  }
}

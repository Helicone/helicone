import { Row } from "@/components/layout/common";
import Header from "@/components/shared/Header";
import LivePill from "@/components/shared/LivePill";
import { AdvancedFilters } from "@/components/shared/themed/themedAdvancedFilters";
import ThemedTimeFilter from "@/components/shared/themed/themedTimeFilter";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { HeliconeRequest, MappedLLMRequest } from "@/packages/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { useGetRequestWithBodies } from "@/services/hooks/requests";
import {
  UIFilterRow,
  UIFilterRowNode,
  UIFilterRowTree,
} from "@/services/lib/filters/types";
import { TimeFilter } from "@/types/timeFilter";
import { Popover } from "@headlessui/react";
import { PinIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { PiFunnelBold } from "react-icons/pi";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { useSelectMode } from "../../../services/hooks/dataset/selectMode";
import { useDebounce } from "../../../services/hooks/debounce";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrganizationLayout } from "../../../services/hooks/organization_layout";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  getRootFilterNode,
  isFilterRowNode,
  isUIFilterRow,
} from "../../../services/lib/filters/uiFilterRowTree";
import {
  OrganizationFilter,
  OrganizationLayout,
  transformFilter,
  transformOrganizationLayoutFilters,
} from "../../../services/lib/organization_layout/organization_layout";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import GenericButton from "../../layout/common/button";
import { useOrg } from "../../layout/org/organizationContext";
import ThemedTable from "../../shared/themed/table/themedTable";
import ThemedModal from "../../shared/themed/themedModal";
import useSearchParams from "../../shared/utils/useSearchParams";
import OnboardingFloatingPrompt from "../dashboard/OnboardingFloatingPrompt";
import NewDataset from "../datasets/NewDataset";
import { getInitialColumns } from "./initialColumns";
import {
  getMockFilterMap,
  getMockProperties,
  getMockRequestCount,
  getMockRequests,
} from "./mockRequestsData";
import RequestDrawer from "./RequestDrawer";
import RequestsEmptyState from "./RequestsEmptyState";
import StreamWarning from "./StreamWarning";
import TableFooter from "./tableFooter";
import UnauthorizedView from "./UnauthorizedView";
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
  evaluatorId?: string;
  rateLimited?: boolean;
  currentFilter: OrganizationFilter | null;
  organizationLayout: OrganizationLayout | null;
  organizationLayoutAvailable: boolean;
}

function getTimeIntervalAgo(interval: TimeInterval): Date {
  const now = new Date();
  const utcNow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
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
  return isCached ? "cache_hits" : "request_response_rmt";
}

function getCreatedAtColumn(isCached: boolean): string {
  return isCached ? "created_at" : "request_created_at";
}

export default function RequestsPage(props: RequestsPageV2Props) {
  // TODO CLEAN UP AND SIMPLIFY ALL THIS STATE
  const {
    currentPage,
    pageSize,
    sort,
    isCached = false,
    initialRequestId,
    userId,
    evaluatorId,
    rateLimited = false,
    currentFilter,
    organizationLayout,
    organizationLayoutAvailable,
  } = props;
  const initialLoadRef = useRef(true);
  const jawn = useJawnClient();
  const orgContext = useOrg();
  const searchParams = useSearchParams();
  const [currFilter, setCurrFilter] = useState(
    searchParams.get("filter") ?? null
  );
  const [drawerSize, setDrawerSize] = useLocalStorage("request-drawer-size", 0);
  const [isLive, setIsLive] = useLocalStorage("isLive-RequestPage", false);

  // Track whether we should show mock data (for users who haven't onboarded)
  const shouldShowMockData = orgContext?.currentOrg?.has_onboarded === false;

  // Create mock data with useMemo to avoid recreating on every render
  const mockRequests = useMemo(() => getMockRequests(pageSize), [pageSize]);
  const mockFilterMap = useMemo(() => getMockFilterMap(), []);
  const mockProperties = useMemo(() => getMockProperties(), []);
  const mockCount = useMemo(() => getMockRequestCount(), []);

  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [selectedDataIndex, setSelectedDataIndex] = useState<number>();
  const { unauthorized, currentTier } = useGetUnauthorized(userId || "");
  const [selectedData, setSelectedData] = useState<
    MappedLLMRequest | undefined
  >(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [showOnboardingPopUp, setShowOnboardingPopUp] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [isFiltersPinned, setIsFiltersPinned] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const popoverContentRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
              gte: new Date(start).toISOString(),
            },
          },
        },
        operator: "and",
        right: {
          [tableName]: {
            [createdAtColumn]: {
              lte: new Date(end).toISOString(),
            },
          },
        },
      };
      return filter;
    } else {
      const timeIntervalDate = getTimeIntervalAgo(
        (currentTimeFilter as TimeInterval) || "1m"
      );
      return {
        [tableName]: {
          [createdAtColumn]: {
            gte: new Date(timeIntervalDate).toISOString(),
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
  const timeRange = useMemo(getTimeRange, [searchParams]);

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedAdvancedFilter]);

  const sortLeaf: SortLeafRequest = getSortLeaf(
    sort.sortKey,
    sort.sortDirection,
    sort.isCustomProperty,
    isCached
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
    searchPropertyFilters: realSearchPropertyFilters,
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

  const count = shouldShowMockData ? mockCount : realCount;
  const isDataLoading = shouldShowMockData ? false : realIsDataLoading;
  const isBodyLoading = shouldShowMockData ? false : realIsBodyLoading;
  const isCountLoading = shouldShowMockData ? false : realIsCountLoading;
  const isRefetching = shouldShowMockData ? false : realIsRefetching;
  const requests = shouldShowMockData ? mockRequests : realRequests;
  const properties = shouldShowMockData ? mockProperties : realProperties;
  const refetch = shouldShowMockData ? () => {} : realRefetch;
  const filterMap = shouldShowMockData ? (mockFilterMap as any) : realFilterMap;
  const searchPropertyFilters = shouldShowMockData
    ? (_property: string, _search: string) =>
        Promise.resolve({ data: null, error: "" })
    : realSearchPropertyFilters;

  const requestWithoutStream = requests.find((r) => {
    return (
      r.raw?.request?.stream &&
      !r.raw?.request?.stream_options?.include_usage &&
      r.heliconeMetadata.provider === "OPENAI"
    );
  });

  const initialRequest = useGetRequestWithBodies(initialRequestId || "");

  useEffect(() => {
    if (initialRequest.data?.data && !selectedData) {
      setSelectedData(
        heliconeRequestToMappedContent(
          initialRequest.data.data as HeliconeRequest
        )
      );
      drawerRef.current?.expand(); // Expand the drawer
      drawerRef.current?.resize(drawerSize);
    }
  }, [initialRequest, selectedData, drawerSize]);

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
          (f: any) =>
            f.label.trim().toLowerCase() === filterLabel.trim().toLowerCase()
        );
        const operatorIdx = filterMap[filterMapIdx]?.operators.findIndex(
          (o: any) =>
            o.label.trim().toLowerCase() === operator.trim().toLowerCase()
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
          value: value,
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
  }, [filterMap, getAdvancedFilters, isDataLoading]);

  // TODO
  useEffect(() => {
    if (
      !isFilterRowNode(advancedFilters) ||
      advancedFilters.rows.length === 0
    ) {
      if (userId) {
        const userFilterMapIndex = filterMap.findIndex(
          (filter: any) => filter.label === "User"
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
    (filter: any) => filter.label === "Helicone-Rate-Limit-Status"
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

  const router = useRouter();

  // Update the page state and router query when the page changes
  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: newPage.toString() },
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  // Sync the page state with the router query on component mount
  useEffect(() => {
    const pageFromQuery = router.query.page;
    if (pageFromQuery && !Array.isArray(pageFromQuery)) {
      const parsedPage = parseInt(pageFromQuery, 10);
      if (!isNaN(parsedPage) && parsedPage !== page) {
        setPage(parsedPage);
      }
    }
  }, [router.query.page, page]);

  const onTimeSelectHandler = (key: TimeInterval, value: string) => {
    const tableName = getTableName(isCached);
    const createdAtColumn = getCreatedAtColumn(isCached);
    if (key === "custom") {
      const [start, end] = value.split("_");
      const filter: FilterNode = {
        left: {
          [tableName]: {
            [createdAtColumn]: {
              gte: new Date(start).toISOString(),
            },
          },
        },
        operator: "and",
        right: {
          [tableName]: {
            [createdAtColumn]: {
              lte: new Date(end).toISOString(),
            },
          },
        },
      };
      setTimeFilter(filter);
    } else {
      setTimeFilter({
        [tableName]: {
          [createdAtColumn]: {
            gte: new Date(getTimeIntervalAgo(key)).toISOString(),
          },
        },
      });
    }
  };

  const columnsWithProperties = useMemo(() => {
    const initialColumns = getInitialColumns(isCached);
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
      })
    );
  }, [properties, isCached]);

  const {
    selectMode: _selectMode,
    toggleSelectMode: _toggleSelectMode,
    selectedIds,
    toggleSelection,
    selectAll,
    isShiftPressed,
  } = useSelectMode({
    items: requests,
    getItemId: (request: MappedLLMRequest) =>
      request.heliconeMetadata.requestId,
  });

  // if shift is pressed, we select the rows in the highlighted range
  // if metakey is pressed, we add the row to the selection
  // if click was on a checkbox, we add the row to the selection
  // else we open the side-tray with details on the request.
  const onRowSelectHandler = (
    row: MappedLLMRequest,
    index: number,
    event?: React.MouseEvent
  ) => {
    // bit of a hack since pre-existing table behavior is noop
    let isCheckboxClick =
      event?.target instanceof HTMLElement &&
      (event.target.tagName.toLowerCase() === "button" ||
        event.target.closest("button") !== null);
    if (isShiftPressed || event?.metaKey || isCheckboxClick) {
      toggleSelection(row);
      return;
    } else {
      setSelectedDataIndex(index);
      setSelectedData(row);
      drawerRef.current?.expand(); // Expand the drawer
      searchParams.set("requestId", row.heliconeMetadata.requestId);
    }
  };

  const onSetAdvancedFiltersHandler = useCallback(
    (filters: UIFilterRowTree, layoutFilterId?: string | null) => {
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
    [searchParams, filterMap]
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

  useEffect(() => {
    orgContext?.refetchOrgs();
    if (orgContext?.currentOrg?.has_onboarded !== undefined) {
      setShowOnboardingPopUp(!orgContext.currentOrg.has_onboarded);
    }
  }, [orgContext]);

  const getDefaultValue = () => {
    const currentTimeFilter = searchParams.get("t");

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const handlePopoverInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return shouldShowMockData ? (
    <div
      className={`transition-opacity duration-500 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <RequestsEmptyState isVisible={shouldShowMockData} />

      <ThemedTable
        id="requests-table"
        defaultData={requests}
        defaultColumns={columnsWithProperties}
        skeletonLoading={false}
        dataLoading={false}
        hideView={true}
        hideHeader={true}
        checkboxMode={"never"}
      />
    </div>
  ) : (
    <main className="h-screen w-full flex flex-col">
      {/* Header */}
      {!userId && (
        <div
          className={
            "flex flex-col items-center justify-center align-center text-center"
          }
        >
          <StreamWarning
            requestWithStreamUsage={requestWithoutStream !== undefined}
          />
        </div>
      )}
      {!userId && (
        <Header
          title={isCached ? "Cached Requests" : "Requests"}
          leftActions={
            <div className="flex flex-row items-center gap-2">
              {advancedFilters && (
                <Popover className="relative flex items-center">
                  {({ open }) => (
                    <>
                      {/* TODO: When there are active filters: add color to button elements + show an active (n) title */}
                      <Popover.Button
                        as={Button}
                        variant="outline"
                        asPill
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (isFiltersPinned) {
                            setShowFilters(!showFilters);
                          } else {
                            setShowFilters(false);
                          }
                        }}
                      >
                        <PiFunnelBold className="h-4 w-4" />
                        <span className="hidden sm:inline font-normal text-[13px]">
                          {isFiltersPinned
                            ? showFilters
                              ? "Hide Filters"
                              : "Show Filters"
                            : "Filters"}
                        </span>
                      </Popover.Button>

                      <Popover.Panel className="min-w-[40rem] w-[40vw] flex items-start p-0 mx-2 rounded-lg absolute z-10 mt-2 bg-white dark:bg-slate-900 shadow-lg border border-border">
                        <div
                          className="w-full"
                          ref={popoverContentRef}
                          onClick={handlePopoverInteraction}
                        >
                          <AdvancedFilters
                            filterMap={filterMap}
                            filters={advancedFilters}
                            setAdvancedFilters={onSetAdvancedFiltersHandler}
                            searchPropertyFilters={searchPropertyFilters}
                            savedFilters={
                              transformedFilters && orgLayout?.data?.id
                                ? transformedFilters
                                : undefined
                            }
                            onSaveFilterCallback={async () => {
                              await orgLayoutRefetch();
                            }}
                            layoutPage={"requests"}
                          />
                          <div className="flex justify-end ml-4">
                            <Button
                              variant="ghostLinear"
                              onClick={() => {
                                setIsFiltersPinned(!isFiltersPinned);
                                setShowFilters(!isFiltersPinned);
                              }}
                              className="text-gray-500 hover:text-gray-700 p-0 mt-4 mr-4 h-auto w-auto"
                            >
                              {isFiltersPinned ? (
                                <PinIcon className="h-5 w-5 text-primary" />
                              ) : (
                                <PinIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </Popover.Panel>
                    </>
                  )}
                </Popover>
              )}
              <ThemedTimeFilter
                currentTimeFilter={getTimeRange()}
                timeFilterOptions={[]}
                onSelect={function (key: string, value: string): void {
                  onTimeSelectHandler(key as TimeInterval, value);
                }}
                isFetching={false}
                defaultValue={getDefaultValue()}
                custom={true}
              />

              {/* TODO: Move inside the popover or wait for Justin's new filter component (more likely) */}
              {/* {organizationLayoutAvailable && (
                <FiltersButton
                  filters={
                    transformedFilters && orgLayout?.data?.id
                      ? transformedFilters
                      : undefined
                  }
                  currentFilter={currFilter ?? undefined}
                  onFilterChange={onLayoutFilterChange}
                  onDeleteCallback={() => {
                    orgLayoutRefetch();
                  }}
                  layoutPage={"requests"}
                />
              )} */}
            </div>
          }
          rightActions={
            <LivePill
              isLive={isLive}
              setIsLive={setIsLive}
              isDataLoading={isDataLoading}
              isRefetching={isRefetching}
              refetch={refetch}
            />
          }
        />
      )}

      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* Requests Table */}
        <ResizablePanel defaultSize={50} minSize={25} className="h-full w-full">
          {unauthorized ? (
            <UnauthorizedView currentTier={currentTier || ""} />
          ) : (
            <ThemedTable
              id="requests-table"
              highlightedIds={selectedData ? [selectedData.id] : selectedIds}
              checkboxMode={"on_hover"}
              defaultData={requests}
              defaultColumns={columnsWithProperties}
              skeletonLoading={isDataLoading}
              dataLoading={isBodyLoading}
              sortable={sort}
              advancedFilters={
                userId
                  ? undefined
                  : {
                      filterMap: filterMap,
                      filters: advancedFilters,
                      setAdvancedFilters: onSetAdvancedFiltersHandler,
                      searchPropertyFilters: searchPropertyFilters,
                      show: !userId,
                    }
              }
              savedFilters={
                organizationLayoutAvailable && !userId
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
              makeRow={{
                properties: properties,
              }}
              onSelectAll={selectAll}
              selectedIds={selectedIds}
              selectedRows={
                selectedIds.length > 0
                  ? {
                      showSelectedCount: true,
                      children: (
                        <GenericButton
                          onClick={() => {
                            setModalOpen(true);
                          }}
                          icon={
                            <PlusIcon className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                          }
                          text="Add to dataset"
                          className="h-8 py-0"
                        />
                      ),
                    }
                  : undefined
              }
            >
              {_selectMode && (
                <Row className="gap-5 items-center w-full justify-between bg-white dark:bg-black p-5">
                  <div className="flex flex-row gap-2 items-center">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      Request Selection:
                    </span>
                    <span className="text-sm p-2 rounded-md font-medium bg-[#F1F5F9] dark:bg-slate-900 text-[#1876D2] dark:text-slate-100 whitespace-nowrap">
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
          minSize={33}
          defaultSize={0}
          onResize={(size) => {
            if (size > 0) {
              setDrawerSize(size);
            }
          }}
          onExpand={() => {
            drawerRef.current?.resize(drawerSize);
          }}
          collapsible={true}
          className="h-full w-full"
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
                    requests[selectedDataIndex - 1].id
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
                    requests[selectedDataIndex + 1].id
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
        pageSize={pageSize}
        isCountLoading={isCountLoading}
        count={count || 0}
        onPageChange={(n) => handlePageChange(n)}
        onPageSizeChange={(n) => setCurrentPageSize(n)}
        pageSizeOptions={[25, 50, 100, 250, 500]}
      />

      {/* Floating Elements */}
      <ThemedModal open={modalOpen} setOpen={setModalOpen}>
        <NewDataset
          request_ids={selectedIds}
          onComplete={() => {
            setModalOpen(false);
          }}
        />
      </ThemedModal>
      <OnboardingFloatingPrompt
        open={showOnboardingPopUp}
        setOpen={setShowOnboardingPopUp}
      />
    </main>
  );
}

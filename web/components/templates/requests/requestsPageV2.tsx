import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";

import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import { Button } from "@/components/ui/button";
import { HeliconeRequest, MappedLLMRequest } from "@/packages/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { useGetRequestWithBodies } from "@/services/hooks/requests";
import {
  UIFilterRow,
  UIFilterRowNode,
  UIFilterRowTree,
} from "@/services/lib/filters/types";
import { TimeFilter } from "@/types/timeFilter";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Row } from "../../layout/common";
import GenericButton from "../../layout/common/button";
import { useOrg } from "../../layout/org/organizationContext";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import ThemedTable from "../../shared/themed/table/themedTable";
import ThemedModal from "../../shared/themed/themedModal";
import useSearchParams from "../../shared/utils/useSearchParams";
import NewDataset from "../datasets/NewDataset";
import DatasetButton from "./buttons/datasetButton";
import { getInitialColumns } from "./initialColumns";
import RequestCard from "./requestCard";
import RequestDiv from "./requestDiv";
import StreamWarning from "./StreamWarning";
import TableFooter from "./tableFooter";
import UnauthorizedView from "./UnauthorizedView";
import useRequestsPageV2 from "./useRequestsPageV2";
import OnboardingFloatingPrompt from "../dashboard/OnboardingFloatingPrompt";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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

const RequestsPageV2 = (props: RequestsPageV2Props) => {
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
  const [isLive, setIsLive] = useLocalStorage("isLive-RequestPage", false);
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
    MappedLLMRequest | undefined
  >(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [showOnboardingPopUp, setShowOnboardingPopUp] = useState(false);

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
          filter: `${filterMap[node.filterMapIdx].label}:${filterMap[node.filterMapIdx].operators[node.operatorIdx].label
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
  const timeRange = useMemo(getTimeRange, []);

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
    count,
    isDataLoading,
    isBodyLoading,
    isCountLoading,
    isRefetching,
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
      setOpen(true);
    }
  }, [initialRequest, selectedData]);

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
    selectMode,
    toggleSelectMode,
    selectedIds,
    toggleSelection,
    selectAll,
    isShiftPressed,
  } = useSelectMode({
    items: requests,
    getItemId: (request: MappedLLMRequest) =>
      request.heliconeMetadata.requestId,
  });

  const onRowSelectHandler = (row: MappedLLMRequest, index: number) => {
    if (selectMode) {
      toggleSelection(row);
    } else {
      setSelectedDataIndex(index);
      setSelectedData(row);
      setOpen(true);
      searchParams.set("requestId", row.heliconeMetadata.requestId);
    }
  };

  useEffect(() => {
    if (searchParams.get("requestId")) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [searchParams]);

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

  useEffect(() => {
    orgContext?.refetchOrgs();
    if (orgContext?.currentOrg?.has_onboarded !== undefined) {
      setShowOnboardingPopUp(!orgContext.currentOrg.has_onboarded);
    }
  }, [orgContext?.currentOrg?.has_onboarded]);

  return (
    <>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={25}>
          <div className="h-screen flex flex-col">
            <div className="mx-10">
              <StreamWarning
                requestWithStreamUsage={requestWithoutStream !== undefined}
              />
            </div>
            {!isCached && userId === undefined && (
              <AuthHeader
                title={isCached ? "Cached Requests" : "Requests"}
                headerActions={
                  <div className="flex flex-row gap-2 items-center">
                    <button
                      onClick={() => {
                        refetch();
                      }}
                      className="font-medium text-black dark:text-white text-sm items-center flex flex-row hover:text-sky-700 dark:hover:text-sky-300"
                    >
                      <ArrowPathIcon
                        className={clsx(
                          isDataLoading || isRefetching ? "animate-spin" : "",
                          "h-4 w-4 inline duration-500 ease-in-out"
                        )}
                      />
                    </button>
                    <Button
                      variant="ghost"
                      className={clsx(
                        "flex flex-row gap-2 items-center",
                        isLive ? "text-green-500 animate-pulse" : "text-slate-500"
                      )}
                      size="sm_sleek"
                      onClick={() => setIsLive(!isLive)}
                    >
                      <div
                        className={clsx(
                          isLive ? "bg-green-500" : "bg-slate-500",
                          "h-2 w-2 rounded-full"
                        )}
                      ></div>
                      <span className="text-xs italic font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {isLive ? "Live" : "Start Live"}
                      </span>
                    </Button>
                  </div>
                }
              />
            )}

            {/* TABLE */}
            {unauthorized ? (
              <UnauthorizedView currentTier={currentTier || ""} />
            ) : (
              <div className="flex flex-col h-full overflow-hidden sentry-mask-me">
                <div
                  className={clsx(
                    isShiftPressed && "no-select",
                    "flex-grow overflow-auto"
                  )}
                >
                  <ThemedTable
                    id="requests-table"
                    highlightedIds={
                      selectedData && open ? [selectedData.id] : selectedIds
                    }
                    showCheckboxes={selectMode}
                    defaultData={requests}
                    defaultColumns={columnsWithProperties}
                    skeletonLoading={isDataLoading}
                    dataLoading={isBodyLoading}
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
                      defaultValue: "1m",
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
                    customButtons={[
                      <div key={"dataset-button"}>
                        <DatasetButton
                          datasetMode={selectMode}
                          setDatasetMode={toggleSelectMode}
                          items={[]}
                          onAddToDataset={() => { }}
                          renderModal={undefined}
                        />
                      </div>,
                    ]}
                    onSelectAll={selectAll}
                    selectedIds={selectedIds}
                    rightPanel={
                      undefined
                    }
                  >
                    {selectMode && (
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
                          <ProFeatureWrapper featureName="Datasets">
                            <GenericButton
                              onClick={() => {
                                setModalOpen(true);
                              }}
                              icon={
                                <PlusIcon className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                              }
                              text="Add to dataset"
                            />
                          </ProFeatureWrapper>
                        )}
                      </Row>
                    )}
                  </ThemedTable>
                </div>

                <div className="bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-700 py-2 flex-shrink-0 w-full">
                  <TableFooter
                    currentPage={page}
                    pageSize={pageSize}
                    isCountLoading={isCountLoading}
                    count={count || 0}
                    onPageChange={(n) => handlePageChange(n)}
                    onPageSizeChange={(n) => setCurrentPageSize(n)}
                    pageSizeOptions={[25, 50, 100, 250, 500]}
                  />
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>



        {open && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={25}>
              <RequestDiv
                open={open}
                setOpen={setOpen}
                request={selectedData}
                properties={properties}
                hasPrevious={
                  selectedDataIndex !== undefined && selectedDataIndex > 0
                }
                hasNext={
                  selectedDataIndex !== undefined &&
                  selectedDataIndex < requests.length - 1
                }
                onPrevHandler={() => {
                  if (
                    selectedDataIndex !== undefined &&
                    selectedDataIndex > 0
                  ) {
                    setSelectedDataIndex(selectedDataIndex - 1);
                    setSelectedData(requests[selectedDataIndex - 1]);
                    searchParams.set(
                      "requestId",
                      requests[selectedDataIndex - 1].id
                    );
                  }
                }}
                onNextHandler={() => {
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
                }}
              />
            </ResizablePanel>
          </>
        )}

      </ResizablePanelGroup>

      <ThemedModal open={modalOpen} setOpen={setModalOpen}>
        <NewDataset
          request_ids={selectedIds}
          onComplete={() => {
            setModalOpen(false);
            toggleSelectMode(false);
          }}
        />
      </ThemedModal>

      <OnboardingFloatingPrompt
        open={showOnboardingPopUp}
        setOpen={setShowOnboardingPopUp}
      />
    </>
  );
};

export default RequestsPageV2;

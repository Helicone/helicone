import FoldedHeader from "@/components/shared/FoldedHeader";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Muted, Small, XSmall } from "@/components/ui/typography";
import { FilterASTButton } from "@/filterAST/FilterASTButton";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { useURLParams } from "@/services/hooks/localURLParams";
import { SortDirection } from "@/services/lib/sorts/requests/sorts";
import { TimeFilter } from "@/types/timeFilter";
import { Check, ChevronDown, PieChart, Table } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useSelectMode } from "../../../services/hooks/dataset/selectMode";
import { useDebounce } from "../../../services/hooks/debounce";
import { getRequestsByIdsWithBodies } from "../../../services/hooks/requests";
import {
  useSessionNames,
  useSessions,
  useSessionsAggregateMetrics,
} from "../../../services/hooks/sessions";
import {
  columnDefsToDragColumnItems,
  DragColumnItem,
} from "../../shared/themed/table/columns/DragList";
import ViewColumns from "../../shared/themed/table/columns/viewColumns";
import ExportButton from "../../shared/themed/table/exportButton";
import ThemedTable from "../../shared/themed/table/themedTable";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import { getColumns } from "./initialColumns";
import { EMPTY_SESSION_NAME } from "./sessionId/SessionContent";
import SessionMetrics from "./SessionMetrics";
import TableFooter from "../requests/tableFooter";
import { useRouter } from "next/router";

interface SessionsPageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex: number;
  selectedName?: string;
}

// Moved from SessionDetails.tsx
export type TSessions = {
  id: string;
  metadata: {
    created_at: string;
    latest_request_created_at: string;
    session_name: string;
    session_id: string;
    total_cost: number;
    total_requests: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    avg_latency: number;
  };
};

const TABS = [
  {
    id: "sessions",
    label: "Sessions",
    icon: <Table size={16} />,
  },
  {
    id: "metrics",
    label: "Metrics",
    icon: <PieChart size={16} />,
  },
];

const SessionsPage = (props: SessionsPageProps) => {
  const tableRef = useRef<any>(null);

  // State for active columns
  const [activeColumns, setActiveColumns] = useState<DragColumnItem[]>(
    columnDefsToDragColumnItems(getColumns()),
  );

  const [currentPageSize, setCurrentPageSize] = useState<number>(
    props.pageSize,
  );
  const [page, setPage] = useState<number>(props.currentPage);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    start: getTimeIntervalAgo("1m"),
    end: new Date(),
  });

  const [sessionIdSearch] = useURLParams<string | undefined>(
    "session-search",
    undefined,
  );

  const [open, setOpen] = useState(false);
  const [sessionNameSearch, setSessionNameSearch] = useState<
    string | undefined
  >(undefined);

  const debouncedSessionNameSearch = useDebounce(sessionNameSearch, 500);

  const names = useSessionNames(debouncedSessionNameSearch ?? "", timeFilter);
  const sessionNames = [
    "All",
    ...names.sessions
      .sort(
        (a, b) =>
          new Date(b.last_used).getTime() - new Date(a.last_used).getTime(),
      )
      .map((name) => name.name),
  ];
  const allNames = useSessionNames("", timeFilter);

  const router = useRouter();
  const debouncedSessionIdSearch = useDebounce(sessionIdSearch, 500); // 0.5 seconds
  const [selectedName, setSelectedName] = useState<string | undefined>(
    props.selectedName,
  );

  const { sessions, isLoading, hasSessions } = useSessions({
    timeFilter,
    sessionIdSearch: debouncedSessionIdSearch ?? "",
    selectedName,
    page: page,
    pageSize: currentPageSize,
  });

  const { aggregateMetrics, isLoading: isCountLoading } =
    useSessionsAggregateMetrics({
      timeFilter,
      sessionIdSearch: debouncedSessionIdSearch ?? "",
      selectedName,
    });

  const sessionsWithId = useMemo(() => {
    return sessions.map((session, index) => ({
      metadata: session,
      id: index.toString(),
    }));
  }, [sessions]);

  const { canCreate, freeLimit } = useFeatureLimit(
    "sessions",
    allNames.sessions.length,
  );

  const [currentTab, setCurrentTab] = useLocalStorage<
    (typeof TABS)[number]["id"]
  >("session-details-tab", "sessions");

  const { selectedIds, toggleSelection, selectAll, isShiftPressed } =
    useSelectMode({
      items: sessionsWithId,
      getItemId: (session: TSessions) => session.id,
    });

  const handleSelectSessionName = (value: string) => {
    if (value === "" || value === "All") {
      setSelectedName(""); // Map placeholder back to empty string
    } else {
      setSelectedName(value);
    }
  };

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

  const isSessionsLoading =
    isLoading || allNames.isLoading || names.isLoading;

  // Helper function to get TimeFilter object
  const getTimeFilterObject = (start: Date, end: Date): TimeFilter => ({
    start,
    end,
  });

  // Callback for ThemedTimeFilter - Moved inside the component
  const onTimeSelectHandler = (key: string, value: string) => {
    if (key === "custom") {
      const [startDate, endDate] = value.split("_");
      setTimeFilter({
        start: new Date(startDate),
        end: new Date(endDate),
      });
    } else {
      // Cast key to TimeInterval for getTimeIntervalAgo
      setTimeFilter({
        start: getTimeIntervalAgo(key as TimeInterval),
        end: new Date(),
      });
    }
  };

  const onFetchBulkSessions = async () => {
    // Download all sessions if no sessions are selected
    if (!selectedIds.length) {
      const data = await getRequestsByIdsWithBodies(sessionsWithId);
      return data;
    }

    const filteredSessions = sessionsWithId.filter((session) =>
      selectedIds.includes(session.id),
    );

    return await getRequestsByIdsWithBodies(filteredSessions);
  };

  const onRowSelectHandler = useCallback(
    (row: TSessions, index: number, event?: React.MouseEvent) => {
      // bit of a hack since pre-existing table behavior is noop
      let isCheckboxClick =
        event?.target instanceof HTMLElement &&
        (event.target.tagName.toLowerCase() === "button" ||
          event.target.closest("button") !== null);
      if (isShiftPressed || event?.metaKey || isCheckboxClick) {
        toggleSelection(row);
      }
    },
    [isShiftPressed, toggleSelection],
  );

  const aggregatedStats = useMemo(() => {
    if (!aggregateMetrics) {
      return {
        avgCost: "-",
        avgLatency: "-",
        totalCost: "-",
        totalSessions: 0,
      };
    }

    return {
      avgCost: `$${aggregateMetrics.avg_cost.toFixed(4)}`,
      avgLatency: `${(aggregateMetrics.avg_latency * 1000).toFixed(0)}ms`,
      totalCost: `$${aggregateMetrics.total_cost.toFixed(4)}`,
      totalSessions: aggregateMetrics.count,
    };
  }, [aggregateMetrics]);
  const statsToDisplay = [
    { label: "Avg Cost", value: aggregatedStats.avgCost },
    { label: "Avg Latency", value: aggregatedStats.avgLatency },
    { label: "Total Cost", value: aggregatedStats.totalCost },
    {
      label: "Total Sessions",
      value: aggregatedStats.totalSessions.toString(),
    },
  ];

  useEffect(() => {
    const pageFromQuery = router.query.page;
    if (pageFromQuery && !Array.isArray(pageFromQuery)) {
      const parsedPage = parseInt(pageFromQuery, 10);
      if (!isNaN(parsedPage) && parsedPage !== page) {
        setPage(parsedPage);
      }
    }
  }, [router.query.page]);

  return hasSessions || isSessionsLoading ? (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <Tabs
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value)}
        className="flex h-full w-full flex-col"
      >
        <FoldedHeader
          leftSection={
            <section className="flex flex-row items-center gap-2">
              <Link href="/sessions" className="no-underline">
                <Small className="font-semibold">Sessions</Small>
              </Link>
              <Small className="font-semibold">/</Small>

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                  asChild
                  className={cn(
                    "flex h-8 w-[180px] items-center justify-between rounded-md border border-sky-200 bg-white px-3 py-2 text-xs ring-offset-white placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sidebar-background",
                    "focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300",
                  )}
                >
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                  >
                    {selectedName === ""
                      ? EMPTY_SESSION_NAME
                      : (selectedName ?? "All")}
                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search sessions..."
                      onChangeCapture={(
                        e: React.ChangeEvent<HTMLInputElement>,
                      ) => {
                        setSessionNameSearch(e.target.value);
                      }}
                    />
                    <CommandEmpty>No results found.</CommandEmpty>

                    <CommandList>
                      {sessionNames.map((name) => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={() => {
                            setOpen(false);
                            handleSelectSessionName(name);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              selectedName === name
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {name === "" ? EMPTY_SESSION_NAME : name}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <ThemedTimeFilter
                currentTimeFilter={getTimeFilterObject(
                  timeFilter.start,
                  timeFilter.end,
                )}
                timeFilterOptions={[]}
                onSelect={onTimeSelectHandler}
                isFetching={isSessionsLoading}
                defaultValue={"1m"}
                custom={true}
              />

              <FilterASTButton />
            </section>
          }
          rightSection={
            <section className="flex flex-row items-center gap-2">
              <div className="flex flex-row items-center gap-2 rounded-lg bg-sky-200">
                {selectedIds.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ExportButton rows={[]} fetchRows={onFetchBulkSessions} />
                    </TooltipTrigger>
                    <TooltipContent>Export raw data</TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex h-8 flex-row items-center divide-x divide-border overflow-hidden rounded-lg border border-border shadow-sm">
                <label className="px-2 py-1 text-xs">Views</label>

                <TabsList
                  size={"sm"}
                  variant={"secondary"}
                  asPill={"none"}
                  className="divide-x divide-border"
                >
                  {TABS.map((tab) => (
                    <TabsTrigger
                      variant={"secondary"}
                      asPill={"none"}
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 bg-sidebar-background dark:bg-sidebar-foreground"
                    >
                      {tab.icon}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <ViewColumns
                columns={tableRef.current?.getAllColumns() || []}
                activeColumns={activeColumns}
                setActiveColumns={setActiveColumns}
              />
            </section>
          }
          foldContent={
            <div className="flex h-full flex-row items-center divide-x divide-border">
              {statsToDisplay.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-row items-center gap-1 px-4"
                >
                  <XSmall className="font-medium">{stat.label}</XSmall>
                  <Muted className="text-xs">{stat.value}</Muted>
                </div>
              ))}
            </div>
          }
        />

        {!canCreate && (
          <FreeTierLimitBanner
            feature="sessions"
            itemCount={allNames.sessions.length}
            freeLimit={freeLimit}
            className="w-full"
          />
        )}

        <TabsContent
          value="sessions"
          className="flex min-h-0 w-full flex-1 flex-col"
        >
          <div className="min-h-0 flex-1">
            <ThemedTable
              id="sessions-table"
              tableRef={tableRef}
              defaultData={sessionsWithId}
              defaultColumns={getColumns()}
              skeletonLoading={isLoading}
              dataLoading={isLoading}
              activeColumns={activeColumns}
              setActiveColumns={setActiveColumns}
              rowLink={(row: TSessions) =>
                `/sessions/${
                  row.metadata.session_name
                    ? encodeURIComponent(row.metadata.session_name)
                    : EMPTY_SESSION_NAME
                }/${encodeURIComponent(row.metadata.session_id)}`
              }
              checkboxMode={"on_hover"}
              onRowSelect={onRowSelectHandler}
              onSelectAll={selectAll}
              selectedIds={selectedIds}
            />
          </div>

          <TableFooter
            currentPage={page}
            pageSize={currentPageSize}
            isCountLoading={isCountLoading}
            count={aggregateMetrics?.count || 0}
            onPageChange={(n) => handlePageChange(n)}
            onPageSizeChange={(n) => setCurrentPageSize(n)}
            pageSizeOptions={[25, 50, 100, 250, 500]}
          />
        </TabsContent>
        <TabsContent value="metrics">
          <SessionMetrics
            selectedSession={
              allNames.sessions.find(
                (session) => session.name === selectedName,
              ) ?? null
            }
            timeFilter={timeFilter}
          />
        </TabsContent>
      </Tabs>
    </main>
  ) : (
    <div className="flex h-screen w-full flex-col bg-background dark:bg-sidebar-background">
      <div className="flex h-full flex-1">
        <EmptyStateCard feature="sessions" />
      </div>
    </div>
  );
};

export default SessionsPage;

import FoldedHeader from "@/components/shared/FoldedHeader";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { ChevronDown } from "lucide-react";
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
import { Muted, Small, XSmall } from "@/components/ui/typography";
import { FilterASTButton } from "@/filterAST/FilterASTButton";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { useURLParams } from "@/services/hooks/localURLParams";
import { SortDirection } from "@/services/lib/sorts/requests/sorts";
import { TimeFilter } from "@/types/timeFilter";
import { PieChart, Table, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ExportButton from "../../shared/themed/table/exportButton";
import { useSelectMode } from "../../../services/hooks/dataset/selectMode";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessionNames, useSessions } from "../../../services/hooks/sessions";
import { getRequestsByIds, getRequestsByIdsWithBodies } from "../../../services/hooks/requests";
import {
  columnDefsToDragColumnItems,
  DragColumnItem,
} from "../../shared/themed/table/columns/DragList";
import ViewColumns from "../../shared/themed/table/columns/viewColumns";
import ThemedTable from "../../shared/themed/table/themedTable";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import { getColumns } from "./initialColumns";
import SessionMetrics from "./SessionMetrics";
import { cn } from "@/lib/utils";
import { Blaka_Ink } from "next/font/google";
import { consoleIntegration } from "@sentry/nextjs";

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

// Define a constant for the unnamed session value
const UNNAMED_SESSION_VALUE = "__helicone_unnamed_session__";

// Moved from SessionDetails.tsx
type TSessions = {
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
  }
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
    columnDefsToDragColumnItems(getColumns())
  );

  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    start: getTimeIntervalAgo("1m"),
    end: new Date(),
  });

  const [sessionIdSearch] = useURLParams<string | undefined>(
    "session-search",
    undefined
  );

  const [open, setOpen] = useState(false);
  const [sessionNameSearch, setSessionNameSearch] = useState<
    string | undefined
  >(undefined);

  const debouncedSessionNameSearch = useDebounce(sessionNameSearch, 500);

  const names = useSessionNames(debouncedSessionNameSearch ?? "", timeFilter);
  const allNames = useSessionNames("", timeFilter);

  const debouncedSessionIdSearch = useDebounce(sessionIdSearch, 500); // 0.5 seconds
  const [selectedName, setSelectedName] = useState<string | undefined>(
    props.selectedName
  );

  const { sessions, isLoading, hasSessions } = useSessions({
    timeFilter,
    sessionIdSearch: debouncedSessionIdSearch ?? "",
    selectedName,
  });

  const sessionsWithId = useMemo(() => {
    return sessions.map((session) => ({
      metadata: session,
      id: session.session_id,
    }));
  }, [sessions]);

  const { canCreate, freeLimit } = useFeatureLimit(
    "sessions",
    allNames.sessions.length
  );

  const [currentTab, setCurrentTab] = useLocalStorage<
    (typeof TABS)[number]["id"]
  >("session-details-tab", "sessions");

  const { hasAccess } = useFeatureLimit("sessions", allNames.sessions.length);

  useEffect(() => {
    if (
      !hasAccess &&
      hasSessions &&
      selectedName === undefined &&
      !allNames.isLoading
    ) {
      const sortedSessions = [...allNames.sessions].sort(
        (a, b) =>
          new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
      );

      if (sortedSessions.length > 0) {
        setSelectedName(sortedSessions[0].name);
      }
    }
  }, [
    hasSessions,
    allNames.sessions,
    allNames.isLoading,
    selectedName,
    hasAccess,
  ]);

  const [selectedData, setSelectedData] = useState<
    TSessions | undefined
  >(undefined);
  const [selectedDataIndex, setSelectedDataIndex] = useState<number>();

  const {
    selectMode,
    toggleSelectMode: _toggleSelectMode,
    selectedIds,
    toggleSelection,
    selectAll,
    isShiftPressed,
  } = useSelectMode({
    items: sessionsWithId,
    getItemId: (session: TSessions) => session.id,
  });

  const handleSelectSessionName = (value: string) => {
    if (value === "all") {
      setSelectedName(undefined);
    } else if (value === UNNAMED_SESSION_VALUE) {
      setSelectedName(""); // Map placeholder back to empty string
    } else {
      setSelectedName(value);
    }
  };

  const isSessionsLoading = isLoading || allNames.isLoading || names.isLoading;

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
    if (selectedIds.length === 0) {
      const data = await getRequestsByIdsWithBodies(
        sessionsWithId.map((session) => session.metadata.session_id)
      )
      return data;
    }
    const data = await getRequestsByIdsWithBodies(selectedIds);
    return data;
  }

  const onRowSelectHandler = useCallback(
    (row: TSessions, index: number, event?: React.MouseEvent) => {
      // bit of a hack since pre-existing table behavior is noop
      let isCheckboxClick =
        event?.target instanceof HTMLElement &&
        (event.target.tagName.toLowerCase() === "button" ||
          event.target.closest("button") !== null);
      if (isShiftPressed || event?.metaKey || isCheckboxClick) {
        toggleSelection(row);
      } else {
        setSelectedDataIndex(index);
        setSelectedData(row);
      }
    },
    [
      isShiftPressed,
      toggleSelection,
      setSelectedDataIndex,
      setSelectedData
    ]
  );

  // Calculate aggregated stats
  const aggregatedStats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return {
        lastUsed: "-",
        avgCost: "-",
        avgLatency: "-",
        totalCost: "-",
        totalSessions: 0,
        createdOn: "-",
      };
    }

    const totalCost = sessions.reduce((sum, s) => sum + s.total_cost, 0);
    const avgCost = totalCost / sessions.length;
    const lastUsed = new Date(
      Math.max(
        ...sessions.map((s) => new Date(s.latest_request_created_at).getTime())
      )
    ).toLocaleString();
    const createdOn = new Date(
      Math.min(...sessions.map((s) => new Date(s.created_at).getTime()))
    ).toLocaleDateString();

    // Calculate simple average of session average latencies
    const totalAvgLatency = sessions.reduce((sum, s) => sum + s.avg_latency, 0);
    const avgLatency =
      sessions.length > 0 ? totalAvgLatency / sessions.length : 0;

    return {
      lastUsed,
      avgCost: `$${avgCost.toFixed(4)}`,
      avgLatency: `${(avgLatency * 1000).toFixed(0)}ms`,
      totalCost: `$${totalCost.toFixed(4)}`,
      totalSessions: sessions.length,
      createdOn,
    };
  }, [sessions]);
  const statsToDisplay = [
    { label: "Last Used", value: aggregatedStats.lastUsed },
    { label: "Avg Cost", value: aggregatedStats.avgCost },
    { label: "Avg Latency", value: aggregatedStats.avgLatency },
    { label: "Total Cost", value: aggregatedStats.totalCost },
    {
      label: "Total Sessions",
      value: aggregatedStats.totalSessions.toString(),
    },
    { label: "Created On", value: aggregatedStats.createdOn },
  ];

  return hasSessions || isSessionsLoading ? (
    <main className="h-screen flex flex-col w-full animate-fade-in">
      <Tabs
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value)}
        className="w-full h-full flex flex-col"
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
                    "flex h-8 w-[280px] items-center justify-between rounded-md border border-sky-200 bg-white px-3 py-2 text-xs ring-offset-white placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sidebar-background",
                    "focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300"
                  )}
                >
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                  >
                    {selectedName === ""
                      ? UNNAMED_SESSION_VALUE
                      : selectedName ?? "All"}
                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50 " />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search sessions..."
                      onChangeCapture={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) => {
                        setSessionNameSearch(e.target.value);
                      }}
                    />
                    <CommandEmpty>No results found.</CommandEmpty>

                    <CommandList>
                      {names.sessions
                        .sort(
                          (a, b) =>
                            new Date(b.last_used).getTime() -
                            new Date(a.last_used).getTime()
                        )
                        .map((session) => (
                          <CommandItem
                            key={session.name}
                            value={
                              session.name === ""
                                ? UNNAMED_SESSION_VALUE
                                : session.name
                            }
                            onSelect={() => {
                              setOpen(false);
                              handleSelectSessionName(
                                session.name === ""
                                  ? UNNAMED_SESSION_VALUE
                                  : session.name
                              );
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                selectedName === session.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {session.name === "" ? "Unnamed" : session.name}
                          </CommandItem>
                        ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <ThemedTimeFilter
                currentTimeFilter={getTimeFilterObject(
                  timeFilter.start,
                  timeFilter.end
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
              <div className="h-8 flex flex-row items-center border border-border rounded-lg divide-x divide-border overflow-hidden shadow-sm">
                <label className="text-xs px-2 py-1">Views</label>

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

              <Tooltip>
                <TooltipTrigger asChild>
                  <ExportButton
                    rows={[]}
                    fetchRows={onFetchBulkSessions}
                  />
                </TooltipTrigger>
                <TooltipContent>Export raw data</TooltipContent>
              </Tooltip>

              <ViewColumns
                columns={tableRef.current?.getAllColumns() || []}
                activeColumns={activeColumns}
                setActiveColumns={setActiveColumns}
              />
            </section>
          }
          foldContent={
            <div className="h-full flex flex-row items-center divide-x divide-border">
              {statsToDisplay.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-row gap-1 items-center px-4"
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

        <TabsContent value="sessions" className="h-full w-full">
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
              `/sessions/${encodeURIComponent(row.id)}`
            }
            checkboxMode={"on_hover"}
            highlightedIds={selectedData ? [selectedData.id] : selectedIds}
            onRowSelect={onRowSelectHandler}
            onSelectAll={selectAll}
            selectedIds={selectedIds}
          />
        </TabsContent>
        <TabsContent value="metrics">
          <SessionMetrics
            selectedSession={
              allNames.sessions.find(
                (session) => session.name === selectedName
              ) ?? null
            }
            timeFilter={timeFilter}
          />
        </TabsContent>
      </Tabs>
    </main>
  ) : (
    <div className="flex flex-col w-full h-screen bg-background dark:bg-sidebar-background">
      <div className="flex flex-1 h-full">
        <EmptyStateCard feature="sessions" />
      </div>
    </div>
  );
};

export default SessionsPage;

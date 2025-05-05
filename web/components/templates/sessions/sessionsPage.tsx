import FoldedHeader from "@/components/shared/FoldedHeader";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Muted, Small, XSmall } from "@/components/ui/typography";
import { FilterASTButton } from "@/filterAST/FilterASTButton";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { useURLParams } from "@/services/hooks/localURLParams";
import { SortDirection } from "@/services/lib/sorts/requests/sorts";
import { TimeFilter } from "@/types/timeFilter";
import { PieChart, Table } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessionNames, useSessions } from "../../../services/hooks/sessions";
import {
  columnDefsToDragColumnItems,
  DragColumnItem,
} from "../../shared/themed/table/columns/DragList";
import ViewColumns from "../../shared/themed/table/columns/viewColumns";
import ThemedTable from "../../shared/themed/table/themedTable";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import { INITIAL_COLUMNS } from "./initialColumns";
import SessionMetrics from "./SessionMetrics";

interface SessionsPageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex: number;
}

// Define a constant for the unnamed session value
const UNNAMED_SESSION_VALUE = "__helicone_unnamed_session__";

// Moved from SessionDetails.tsx
type TSessions = {
  created_at: string;
  latest_request_created_at: string;
  session_id: string;
  session_name: string;
  total_cost: number;
  total_requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  avg_latency: number;
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
    columnDefsToDragColumnItems(INITIAL_COLUMNS)
  );

  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo("1m"),
    end: new Date(),
  });

  const [sessionIdSearch] = useURLParams<string | undefined>(
    "session-search",
    undefined
  );
  const [sessionNameSearch] = useState<string | undefined>(undefined);

  const debouncedSessionNameSearch = useDebounce(sessionNameSearch, 500);

  const names = useSessionNames(debouncedSessionNameSearch ?? "");
  const allNames = useSessionNames("");

  const debouncedSessionIdSearch = useDebounce(sessionIdSearch, 500); // 0.5 seconds
  const [selectedName, setSelectedName] = useState<string | undefined>(
    undefined
  );

  const { sessions, isLoading, hasSessions } = useSessions({
    timeFilter,
    sessionIdSearch: debouncedSessionIdSearch ?? "",
    selectedName,
  });

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

              <Select
                value={
                  selectedName === ""
                    ? UNNAMED_SESSION_VALUE // Map empty string to placeholder
                    : selectedName ?? "all"
                }
                onValueChange={handleSelectSessionName}
              >
                <SelectTrigger className="w-[280px] h-8 shadow-sm">
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {allNames.sessions.map((session) => (
                    <SelectItem
                      key={session.name}
                      value={
                        session.name === ""
                          ? UNNAMED_SESSION_VALUE
                          : session.name
                      }
                    >
                      {session.name === "" ? "Unnamed" : session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                      className="flex items-center gap-2"
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
            defaultData={sessions || []}
            defaultColumns={INITIAL_COLUMNS}
            skeletonLoading={isLoading}
            dataLoading={isLoading}
            activeColumns={activeColumns}
            setActiveColumns={setActiveColumns}
            rowLink={(row: TSessions) =>
              `/sessions/${encodeURIComponent(row.session_id)}`
            }
          />
        </TabsContent>
        <TabsContent value="metrics">
          <SessionMetrics
            selectedSession={
              allNames.sessions.find(
                (session) => session.name === selectedName
              ) ?? null
            }
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

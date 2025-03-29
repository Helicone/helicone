import AuthHeader from "@/components/shared/authHeader";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { useURLParams } from "@/services/hooks/localURLParams";
import { SortDirection } from "@/services/lib/sorts/requests/sorts";
import { ChartPieIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessionNames, useSessions } from "../../../services/hooks/sessions";
import { Row } from "../../layout/common/row";
import SessionNameSelection from "./nameSelection";
import SessionDetails from "./sessionDetails";

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

const TABS = [
  {
    id: "sessions",
    label: "Sessions",
    icon: <ListBulletIcon className="w-4 h-4" />,
  },
  {
    id: "metrics",
    label: "Metrics",
    icon: <ChartPieIcon className="w-4 h-4" />,
  },
];

const SessionsPage = (props: SessionsPageProps) => {
  const { sort } = props;

  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo("1m"),
    end: new Date(),
  });

  const [sessionIdSearch, setSessionIdSearch] = useURLParams<
    string | undefined
  >("session-search", undefined);
  const [sessionNameSearch, setSessionNameSearch] = useState<
    string | undefined
  >(undefined);

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

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => setCurrentTab(value)}
      className="w-full"
    >
      <div>
        {hasSessions || isLoading ? (
          <>
            <AuthHeader
              isWithinIsland={true}
              title={
                <div className="flex items-center gap-2 ml-8">Sessions</div>
              }
              actions={
                <TabsList className="grid w-full grid-cols-2 mr-8">
                  {TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2"
                    >
                      {tab.icon}
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
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

            <Row className="border-t border-slate-200 dark:border-slate-800">
              <SessionNameSelection
                sessionNameSearch={sessionNameSearch}
                selectedName={selectedName}
                setSessionNameSearch={setSessionNameSearch}
                setSelectedName={setSelectedName}
                sessionNames={names.sessions}
                totalSessionCount={allNames.totalCount}
              />
              <SessionDetails
                currentTab={currentTab}
                selectedSession={
                  names.sessions.find(
                    (session) => session.name === selectedName
                  ) ?? null
                }
                sessionIdSearch={sessionIdSearch ?? ""}
                setSessionIdSearch={setSessionIdSearch}
                sessions={sessions}
                isLoading={
                  isLoading ||
                  allNames.isLoading ||
                  allNames.isRefetching ||
                  isLoading ||
                  names.isLoading ||
                  names.isRefetching
                }
                sort={sort}
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
                setInterval={() => {}}
              />
            </Row>
          </>
        ) : (
          <div className="flex flex-col w-full h-screen bg-background dark:bg-sidebar-background">
            <div className="flex flex-1 h-full">
              <EmptyStateCard feature="sessions" />
            </div>
          </div>
        )}
      </div>
    </Tabs>
  );
};

export default SessionsPage;

import { useOrg } from "@/components/layout/org/organizationContext";
import { useHasAccess } from "@/hooks/useHasAccess";

import AuthHeader from "@/components/shared/authHeader";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { useURLParams } from "@/services/hooks/localURLParams";
import { SESSIONS_TABLE_FILTERS } from "@/services/lib/filters/frontendFilterDefs";
import { UIFilterRowTree } from "@/services/lib/filters/types";
import {
  filterUITreeToFilterNode,
  getRootFilterNode,
} from "@/services/lib/filters/uiFilterRowTree";
import { ChartPieIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { ListTree } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessionNames, useSessions } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
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
  const { currentPage, pageSize, sort, defaultIndex } = props;

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

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 500); // 0.5 seconds

  const onSetAdvancedFiltersHandler = useCallback(
    (filters: UIFilterRowTree) => {
      setAdvancedFilters(filters);
    },
    []
  );

  const { sessions, refetch, isLoading } = useSessions(
    timeFilter,
    debouncedSessionIdSearch ?? "",
    filterUITreeToFilterNode(
      SESSIONS_TABLE_FILTERS,
      debouncedAdvancedFilters
    ) as any,
    selectedName
  );

  const org = useOrg();

  const hasAccess = useHasAccess("sessions");

  const hasSomeSessions = useMemo(() => {
    return allNames.sessions.length > 0;
  }, [allNames.sessions.length]);

  const hasAccessToSessions = useMemo(() => {
    return (
      hasAccess ||
      (hasSomeSessions &&
        new Date().getTime() < new Date("2024-09-27").getTime())
    );
  }, [hasAccess, hasSomeSessions]);

  const [currentTab, setCurrentTab] = useLocalStorage<
    (typeof TABS)[number]["id"]
  >("session-details-tab", "sessions");

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => setCurrentTab(value)}
      className="w-full"
    >
      <div>
        {allNames.isLoading ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <LoadingAnimation />
          </div>
        ) : hasAccessToSessions ? (
          hasSomeSessions ? (
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
              <Row className="border-t border-slate-200 dark:border-slate-800">
                <SessionNameSelection
                  sessionNameSearch={sessionNameSearch}
                  selectedName={selectedName}
                  setSessionNameSearch={setSessionNameSearch}
                  setSelectedName={setSelectedName}
                  sessionNames={names.sessions}
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
                  isLoading={isLoading}
                  sort={sort}
                  timeFilter={timeFilter}
                  setTimeFilter={setTimeFilter}
                  setInterval={() => {}}
                  advancedFilters={advancedFilters}
                  onSetAdvancedFiltersHandler={onSetAdvancedFiltersHandler}
                />
              </Row>
            </>
          ) : (
            <div className="flex flex-col w-full min-h-screen items-center bg-[hsl(var(--background))]">
              <EmptyStateCard feature="sessions" />
            </div>
          )
        ) : org?.currentOrg?.tier === "free" ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-[hsl(var(--background))]">
            <FeatureUpgradeCard
              title="Sessions"
              featureImage={{
                type: "image",
                content: "/static/featureUpgrade/sessions-graphic.webp",
              }}
              headerTagline="Group, analyze and fix AI workflows"
              icon={<ListTree className="w-4 h-4 text-sky-500" />}
              highlightedFeature="sessions"
            />
          </div>
        ) : (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <FeatureUpgradeCard
              title="Sessions"
              featureImage={{
                type: "image",
                content: "/static/featureUpgrade/sessions-graphic.webp",
              }}
              headerTagline="Group, analyze and fix AI workflows"
              icon={<ListTree className="w-4 h-4 text-sky-500" />}
              highlightedFeature="sessions"
            />
          </div>
        )}
      </div>
    </Tabs>
  );
};

export default SessionsPage;

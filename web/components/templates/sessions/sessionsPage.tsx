import { useOrg } from "@/components/layout/org/organizationContext";
import { useHasAccess } from "@/hooks/useHasAccess";

import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { useURLParams } from "@/services/hooks/localURLParams";
import { SESSIONS_TABLE_FILTERS } from "@/services/lib/filters/frontendFilterDefs";
import {
  filterUITreeToFilterNode,
  getRootFilterNode,
} from "@/services/lib/filters/uiFilterRowTree";
import { UIFilterRowTree } from "@/services/lib/filters/types";
import { ChartPieIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { useCallback, useMemo, useState } from "react";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessionNames, useSessions } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Row } from "../../layout/common/row";
import AuthHeader from "../../shared/authHeader";
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
  }, [org?.currentOrg?.tier, hasSomeSessions]);

  const [currentTab, setCurrentTab] = useLocalStorage<
    (typeof TABS)[number]["id"]
  >("session-details-tab", "sessions");

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => setCurrentTab(value)}
      className="w-full"
    >
      {/* <AuthHeader
        isWithinIsland={true}
        title={<div className="flex items-center gap-2 ml-8">Sessions</div>}
        actions={
          <TabsList className="grid w-full grid-cols-2 mr-8">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        }
      /> */}

      <div>
        {allNames.isLoading ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <LoadingAnimation />
          </div>
        ) : hasAccessToSessions ? (
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
        ) : org?.currentOrg?.tier === "free" ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-white">
            <FeatureUpgradeCard
              layoutType="featureShowcase"
              title="Sessions"
              description="Group, analyze and fix AI workflows"
              infoBoxText="Group and visualize multi-step LLM interactions by adding 2 simple headers."
              pricingTiers={["hobby", "pro", "team"]}
              featureImage="/static/featureUpgrade/session-view.webp"
              integrationImage="/integration-steps.png"
              documentationLink="/docs/sessions"
              headerTagline="Group, analyze and fix AI workflows"
              proFeatures={[
                "Unlimited session history",
                "Advanced analytics",
                "Collaboration tools",
                "Priority support",
              ]}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <FeatureUpgradeCard
              layoutType="featureShowcase"
              title="Sessions"
              description="Group, analyze and fix AI workflows"
              infoBoxText="Group and visualize multi-step LLM interactions by adding 2 simple headers."
              pricingTiers={["hobby", "pro", "team"]}
              featureImage="/static/featureUpgrade/sessionsView.webp"
              integrationImage="/integration-steps.png"
              documentationLink="/docs/sessions"
              proFeatures={[
                "Unlimited session history",
                "Advanced analytics",
                "Collaboration tools",
                "Priority support",
              ]}
            />
          </div>
        )}
      </div>
    </Tabs>
  );
};

export default SessionsPage;

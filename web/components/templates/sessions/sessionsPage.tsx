import { useOrg } from "@/components/layout/organizationContext";

import { Badge } from "@tremor/react";
import { useCallback, useMemo, useState } from "react";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessionNames, useSessions } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Row } from "../../layout/common/row";
import AuthHeader from "../../shared/authHeader";
import SessionNameSelection from "./nameSelection";
import SessionDetails from "./sessionDetails";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import Link from "next/link";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Tabs, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { ChartPieIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { SESSIONS_TABLE_FILTERS } from "@/services/lib/filters/frontendFilterDefs";
import {
  filterUITreeToFilterNode,
  getRootFilterNode,
  UIFilterRowTree,
} from "@/services/lib/filters/uiFilterRowTree";

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

  const [sessionIdSearch, setSessionIdSearch] = useState<string>("");
  const [sessionNameSearch, setSessionNameSearch] = useState<string>("");
  const debouncedSessionNameSearch = useDebounce(sessionNameSearch, 500);

  const names = useSessionNames(debouncedSessionNameSearch ?? "");
  const allNames = useSessionNames("");

  const debouncedSessionIdSearch = useDebounce(sessionIdSearch, 500); // 0.5 seconds
  const [selectedName, setSelectedName] = useState<string>("");

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
    debouncedSessionIdSearch,
    selectedName,
    filterUITreeToFilterNode(
      SESSIONS_TABLE_FILTERS,
      debouncedAdvancedFilters
    ) as any
  );

  const org = useOrg();

  const hasSomeSessions = useMemo(() => {
    return allNames.sessions.length > 0;
  }, [allNames.sessions.length]);

  const hasAccessToSessions = useMemo(() => {
    return (
      org?.currentOrg?.tier !== "free" ||
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
      <AuthHeader
        isWithinIsland={true}
        title={
          <div className="flex items-center gap-2 ml-8">
            Sessions <Badge>Beta</Badge>
          </div>
        }
        actions={
          selectedName && (
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
          )
        }
      />
      {org?.currentOrg?.tier === "free" && (
        <InfoBox title="Sessions is a Pro feature">
          <p>
            Sessions is a Pro feature. In order to keep using it, you need to
            upgrade your plan before September 27th, 2024.{" "}
            <Link href="/settings/billing" className="text-blue-500 underline">
              Upgrade to Pro
            </Link>
          </p>
        </InfoBox>
      )}
      <div>
        {allNames.isLoading ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <LoadingAnimation />
          </div>
        ) : hasAccessToSessions &&
          (hasSomeSessions || hasSomeSessions === null) ? (
          <Row className="border-t border-slate-200 dark:border-slate-800">
            <SessionNameSelection
              sessionNameSearch={sessionNameSearch}
              setSessionNameSearch={setSessionNameSearch}
              sessionIdSearch={sessionIdSearch}
              setSessionIdSearch={setSessionIdSearch}
              selectedName={selectedName}
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
              sessionIdSearch={sessionIdSearch}
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
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <FeatureUpgradeCard
              title="Unlock Sessions"
              description="The Free plan does not include the Sessions feature, but getting access is easy."
              infoBoxText="Group and visualize multi-step LLM interactions by adding 2 simple headers."
              videoSrc="https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/sessions.mp4"
              documentationLink="https://docs.helicone.ai/features/sessions"
              tier={org?.currentOrg?.tier ?? "free"}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <FeatureUpgradeCard
              title="Get Started with Sessions"
              description="You have access to Sessions, but haven't created any yet. It's easy to get started!"
              infoBoxText="Group and visualize multi-step LLM interactions by adding 2 simple headers to your requests."
              videoSrc="https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/sessions.mp4"
              documentationLink="https://docs.helicone.ai/features/sessions"
              tier={org?.currentOrg?.tier ?? "free"}
            />
          </div>
        )}
      </div>
    </Tabs>
  );
};

export default SessionsPage;

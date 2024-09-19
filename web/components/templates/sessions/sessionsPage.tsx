import { useOrg } from "@/components/layout/organizationContext";

import { Badge } from "@tremor/react";
import { useEffect, useState } from "react";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessionNames, useSessions } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Row } from "../../layout/common/row";
import AuthHeader from "../../shared/authHeader";
import SessionNameSelection from "./nameSelection";
import SessionDetails from "./sessionDetails";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";

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
const SessionsPage = (props: SessionsPageProps) => {
  const { currentPage, pageSize, sort, defaultIndex } = props;

  const [interval, setInterval] = useState<TimeInterval>("24h");

  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });

  const [sessionIdSearch, setSessionIdSearch] = useState<string>("");
  const names = useSessionNames(sessionIdSearch ?? "");

  const debouncedSessionIdSearch = useDebounce(sessionIdSearch, 500); // 0.5 seconds
  const [selectedName, setSelectedName] = useState<string>("");

  const { sessions, refetch, isLoading } = useSessions(
    timeFilter,
    debouncedSessionIdSearch,
    selectedName
  );

  const [hasSomeSessions, setHasSomeSessions] = useState<boolean | null>(null);

  const org = useOrg();

  const [isPlanComparisonVisible, setIsPlanComparisonVisible] = useState(false);

  useEffect(() => {
    if (hasSomeSessions === null && !names.isLoading) {
      setHasSomeSessions(names.sessions.length > 0);
    }
  }, [hasSomeSessions, names.sessions.length, names.isLoading]);

  return (
    <>
      <AuthHeader
        title={
          <div className="flex items-center gap-2">
            Sessions <Badge color="gray">Beta</Badge>
          </div>
        }
      />
      <div>
        {!isLoading &&
        org?.currentOrg?.tier !== "free" &&
        (hasSomeSessions || hasSomeSessions === null) ? (
          <Row className="gap-5 ">
            <SessionNameSelection
              sessionIdSearch={sessionIdSearch}
              setSessionIdSearch={setSessionIdSearch}
              selectedName={selectedName}
              setSelectedName={setSelectedName}
              sessionNames={names.sessions}
            />
            <SessionDetails
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
              setInterval={setInterval}
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
    </>
  );
};

export default SessionsPage;

import { useOrg } from "@/components/layout/organizationContext";

import { Badge } from "@tremor/react";
import { useMemo, useState } from "react";
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
import { IslandContainer } from "@/components/ui/islandContainer";

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

  const { sessions, refetch, isLoading } = useSessions(
    timeFilter,
    debouncedSessionIdSearch,
    selectedName
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
  return (
    <>
      <AuthHeader
        isWithinIsland={true}
        title={
          <IslandContainer>
            <div className="flex items-center gap-2">
              Sessions <Badge>Beta</Badge>
            </div>
          </IslandContainer>
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

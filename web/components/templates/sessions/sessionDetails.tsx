import { useRouter } from "next/router";
import { useMemo } from "react";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useSessionNames } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Col } from "../../layout/common/col";
import ThemedTable from "../../shared/themed/table/themedTable";
import { INITIAL_COLUMNS } from "./initialColumns";

import SessionMetrics from "./SessionMetrics";
import { PiGraphLight } from "react-icons/pi";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type TSessions = {
  created_at: string;
  latest_request_created_at: string;
  session: string;
  total_cost: number;
  total_requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type SessionResult = ReturnType<
  typeof useSessionNames
>["sessions"][number];
interface SessionDetailsProps {
  currentTab: string;
  selectedSession: SessionResult | null;
  sessionIdSearch: string;
  setSessionIdSearch: (value: string) => void;
  sessions: TSessions[];
  isLoading: boolean;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  timeFilter: {
    start: Date;
    end: Date;
  };
  setTimeFilter: (filter: { start: Date; end: Date }) => void;
  setInterval: (interval: TimeInterval) => void;
}

const SessionDetails = ({
  currentTab,
  selectedSession,
  sessionIdSearch,
  setSessionIdSearch,
  sessions,
  isLoading,
  sort,
  timeFilter,
  setTimeFilter,
  setInterval,
}: SessionDetailsProps) => {
  const router = useRouter();

  const totalCost = useMemo(() => {
    return sessions
      .reduce((acc, session) => acc + session.total_cost, 0)
      .toFixed(3);
  }, [sessions]);

  if (selectedSession)
    return (
      <Col className="space-y-4 w-full border-r border-slate-200 dark:border-slate-800 overflow-x-auto">
        <TabsContent value="sessions" className="m-0">
          <ThemedTable
            id="session-table"
            defaultData={sessions || []}
            defaultColumns={INITIAL_COLUMNS}
            skeletonLoading={isLoading}
            search={{
              value: sessionIdSearch,
              onChange: setSessionIdSearch,
              placeholder: "Search session id...",
            }}
            dataLoading={false}
            sortable={sort}
            timeFilter={{
              currentTimeFilter: timeFilter,
              defaultValue: "all",
              onTimeSelectHandler: (key: TimeInterval, value: string) => {
                if ((key as string) === "custom") {
                  const [startDate, endDate] = value.split("_");

                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  setInterval(key);
                  setTimeFilter({
                    start,
                    end,
                  });
                } else {
                  setInterval(key);
                  setTimeFilter({
                    start: getTimeIntervalAgo(key),
                    end: new Date(),
                  });
                }
              },
            }}
            onRowSelect={(row) => {
              router.push(`/sessions/${row.session}`);
            }}
          />
        </TabsContent>

        <TabsContent value="metrics">
          <SessionMetrics selectedSession={selectedSession} />
        </TabsContent>
      </Col>
    );

  return (
    <div className="flex flex-col w-full h-96 justify-center items-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center pt-6">
          <PiGraphLight className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-xl mb-2">No Session Selected</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Please select a session to view its details
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionDetails;

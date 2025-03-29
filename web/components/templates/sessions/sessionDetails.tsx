import { TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/router";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useSessionNames } from "../../../services/hooks/sessions";

import { Col } from "../../layout/common/col";
import ThemedTable from "../../shared/themed/table/themedTable";
import { INITIAL_COLUMNS } from "./initialColumns";
import SessionMetrics from "./SessionMetrics";
import { SortDirection } from "@/services/lib/sorts/requests/sorts";

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
};

type SessionResult = ReturnType<typeof useSessionNames>["sessions"][number];

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
            placeholder: "Search session id or name...",
          }}
          dataLoading={false}
          sortable={sort}
          showFilters
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
          rowLink={(row) => `/sessions/${encodeURIComponent(row.session_id)}`}
        />
      </TabsContent>
      <TabsContent value="metrics">
        <SessionMetrics selectedSession={selectedSession} />
      </TabsContent>
    </Col>
  );
};

export default SessionDetails;

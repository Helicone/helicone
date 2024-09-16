import { useLocalStorage } from "@/services/hooks/localStorage";
import {
  ChartPieIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { getTimeAgo } from "../../../lib/sql/timeHelpers";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useSessionNames } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Row } from "../../layout/common";
import { Col } from "../../layout/common/col";
import ThemedTable from "../../shared/themed/table/themedTable";
import ThemedTabSelector from "../../shared/themed/themedTabSelector";
import { INITIAL_COLUMNS } from "./initialColumns";

import SessionMetrics from "./SessionMetrics";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";

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

  const [currentTab, setCurrentTab] = useLocalStorage<
    (typeof TABS)[number]["id"]
  >("session-details-tab", "sessions");

  return (
    <Col className="space-y-4 w-full max-w-2xl">
      <div>
        <div className="text-xl font-semibold">
          {selectedSession?.name ?? "No Name"}
        </div>
        <ul className="text-xs mt-1 text-gray-500 flex flex-row gap-5 list-disc">
          <p>
            <span className="font-semibold text-sky-500">
              Active:{" "}
              {getTimeAgo(new Date(selectedSession?.last_used ?? Date.now()))}
            </span>
          </p>
          <li className="font-semibold">{sessions.length} sessions</li>
          <li>
            Total cost: <span className="font-semibold">${totalCost}</span>
          </li>
          <li>
            Created on:{" "}
            {new Date(selectedSession?.created_at ?? Date.now())
              .toDateString()
              .slice(4)}
          </li>
        </ul>
      </div>

      <Row className="items-center justify-between gap-10">
        <ThemedTabSelector
          tabs={TABS}
          currentTab={currentTab}
          onTabChange={(tabId) =>
            setCurrentTab(tabId as (typeof TABS)[number]["id"])
          }
        />
        <TextInput
          icon={MagnifyingGlassIcon}
          value={sessionIdSearch}
          onValueChange={(value) => setSessionIdSearch(value)}
          placeholder="Search session id..."
        />
      </Row>
      {currentTab === "sessions" ? (
        <ThemedTable
          id="session-table"
          defaultData={sessions || []}
          defaultColumns={INITIAL_COLUMNS}
          skeletonLoading={isLoading}
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
      ) : (
        <SessionMetrics selectedSession={selectedSession} />
      )}
    </Col>
  );
};

export default SessionDetails;

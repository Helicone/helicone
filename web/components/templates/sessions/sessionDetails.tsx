import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import { useRouter } from "next/router";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Col } from "../../layout/common/col";
import ThemedTable from "../../shared/themed/table/themedTable";
import { INITIAL_COLUMNS } from "./initialColumns";
import { getTimeAgo } from "../../../lib/sql/timeHelpers";
import { useEffect, useState } from "react";
import { updateLocale } from "moment";

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

interface SessionDetailsProps {
  selectedName: string;
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
  selectedName,
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
  const [lastUsedSession, setLastUsedSession] = useState<TSessions>();
  const [oldestSession, setOldestSession] = useState<TSessions>();
  const [totalCost, setTotalCost] = useState("0.0");

  function calculateMetadata() {
    if (sessions.length === 0) return;

    setLastUsedSession(sessions.reduce((latestSession, currentSession) => {
      return new Date(currentSession.latest_request_created_at) > new Date(latestSession.latest_request_created_at)
        ? currentSession
        : latestSession;
    }))

    setTotalCost(sessions.reduce((acc, session) => acc + session.total_cost, 0).toFixed(3));

    setOldestSession(sessions.reduce((latestSession, currentSession) => {
      return new Date(currentSession.latest_request_created_at) > new Date(latestSession.latest_request_created_at)
        ? currentSession
        : latestSession;
    }))
  };

  useEffect(() => {
    calculateMetadata();
  }, [sessions]);

  return (
    <Col className="space-y-4 min-w-0">
      <div>
        <div className="text-xl font-semibold">
          {selectedName ? selectedName : "No Name"}
        </div>
        <ul className="text-xs mt-1 text-gray-500 flex flex-row gap-5 list-disc">
          <p>Last used <span className="font-semibold text-sky-500">{getTimeAgo(new Date(lastUsedSession?.latest_request_created_at ?? Date.now()))}</span></p>
          <li className="font-semibold">{sessions.length} sessions</li>
          <li>Total cost: <span className="font-semibold">${totalCost}</span></li>
          <li>Created on: {(new Date(oldestSession?.created_at ?? Date.now())).toDateString().slice(4,)}</li>
        </ul>
      </div>
      <TextInput
        icon={MagnifyingGlassIcon}
        value={sessionIdSearch}
        onValueChange={(value) => setSessionIdSearch(value)}
        placeholder="Search session id..."
      />
      <ThemedTable
        id="session-table"
        defaultData={sessions || []}
        defaultColumns={INITIAL_COLUMNS}
        dataLoading={isLoading}
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
    </Col>
  );
};

export default SessionDetails;

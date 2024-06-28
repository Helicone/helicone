import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import { useRouter } from "next/router";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Col } from "../../layout/common/col";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { INITIAL_COLUMNS } from "./initialColumns";

interface SessionDetailsProps {
  selectedName: string;
  sessionIdSearch: string;
  setSessionIdSearch: (value: string) => void;
  sessions: any[];
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

  return (
    <Col className="space-y-4 min-w-0">
      <div>
        <div className="text-xl font-semibold">
          {selectedName ? selectedName : "No Name"}
        </div>
      </div>
      <TextInput
        icon={MagnifyingGlassIcon}
        value={sessionIdSearch}
        onValueChange={(value) => setSessionIdSearch(value)}
        placeholder="Search session id..."
      />
      <ThemedTableV5
        defaultData={sessions || []}
        defaultColumns={INITIAL_COLUMNS}
        tableKey="sessionColumnVisibility"
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

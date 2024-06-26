import { useState } from "react";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessions } from "../../../services/hooks/sessions";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { useRouter } from "next/router";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  userTableFilters,
} from "../../../services/lib/filters/frontendFilterDefs";
import AuthHeader from "../../shared/authHeader";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { INITIAL_COLUMNS } from "./initialColumns";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { TextInput } from "@tremor/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);

  const router = useRouter();

  const [interval, setInterval] = useState<TimeInterval>("24h");

  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });

  const [sessionIdSearch, setSessionIdSearch] = useState<string>("");

  const debouncedSessionIdSearch = useDebounce(sessionIdSearch, 500); // 0.5 seconds

  const { sessions, refetch, isLoading } = useSessions(
    timeFilter,
    debouncedSessionIdSearch
  );

  return (
    <>
      <AuthHeader title={"Sessions (beta)"} />
      <div className="flex flex-col space-y-4">
        <TextInput
          icon={MagnifyingGlassIcon}
          value={sessionIdSearch}
          onValueChange={(value) => setSessionIdSearch(value)}
          placeholder="Search session..."
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
      </div>
    </>
  );
};

export default SessionsPage;

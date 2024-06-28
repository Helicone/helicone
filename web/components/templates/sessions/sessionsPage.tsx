import { useRouter } from "next/router";
import { useState } from "react";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessions } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Row } from "../../layout/common/row";
import AuthHeader from "../../shared/authHeader";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
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
  const [selectedName, setSelectedName] = useState<string>("");

  const { sessions, refetch, isLoading } = useSessions(
    timeFilter,
    debouncedSessionIdSearch,
    selectedName
  );

  return (
    <>
      <AuthHeader title={"Sessions (beta)"} />
      <Row className="gap-5 ">
        <SessionNameSelection
          sessionIdSearch={sessionIdSearch}
          setSessionIdSearch={setSessionIdSearch}
          selectedName={selectedName}
          setSelectedName={setSelectedName}
        />
        <SessionDetails
          selectedName={selectedName}
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
    </>
  );
};

export default SessionsPage;

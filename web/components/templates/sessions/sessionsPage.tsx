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
import { userTableFilters } from "../../../services/lib/filters/frontendFilterDefs";
import AuthHeader from "../../shared/authHeader";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { INITIAL_COLUMNS } from "./initialColumns";

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
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 500); // 0.5 seconds

  const router = useRouter();

  const sortLeaf: SortLeafRequest =
    sort.sortKey && sort.sortDirection
      ? {
          [sort.sortKey]: sort.sortDirection,
        }
      : {
          created_at: "desc",
        };

  const { sessions, refetch, isLoading } = useSessions(
    currentPage,
    pageSize,
    sortLeaf,
    filterListToTree(
      filterUIToFilterLeafs(
        userTableFilters.sort((a, b) => a.label.localeCompare(b.label)),
        debouncedAdvancedFilters
      ),
      "and"
    )
  );

  console.log(`Sessions: ${JSON.stringify(sessions)}`);
  return (
    <>
      <AuthHeader title={"Sessions"} />
      <div className="flex flex-col space-y-4">
        <ThemedTableV5
          defaultData={sessions || []}
          defaultColumns={INITIAL_COLUMNS}
          tableKey="sessionColumnVisibility"
          dataLoading={isLoading}
          sortable={sort}
          advancedFilters={{
            filterMap: userTableFilters,
            filters: advancedFilters,
            setAdvancedFilters,
            searchPropertyFilters: async () => ({
              data: null,
              error: "Not implemented",
            }),
          }}
          exportData={sessions}
          onRowSelect={(row: any) => {
            router.push(`/sessions/${row.session_id}`);
          }}
        />
      </div>
    </>
  );
};

export default SessionsPage;

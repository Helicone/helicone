import { useState } from "react";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessions } from "../../../services/hooks/sessions";

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

  const { sessions, refetch } = useSessions(
    currentPage,
    pageSize,
    sortLeaf,
    debouncedAdvancedFilters
  );

  return <>{/* SessionsPage */}</>;
};

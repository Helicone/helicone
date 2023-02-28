import { useGetProperties } from "../../../services/hooks/properties";
import { useGetRequests } from "../../../services/hooks/requests";
import { Column } from "../../ThemedTableV2";
import { AdvancedFilterType } from "../users/usersPage";

const useRequests = (
  currentTimeFilter: string,
  currentPage: number,
  currentPageSize: number,
  sortBy: string | null,
  advancedFilters?: {
    idx: number;
    type?: "number" | "text" | "datetime-local" | undefined;
    supabaseKey?: string | undefined;
    value?: string | undefined;
    column?: Column | undefined;
    operator?: "eq" | "gt" | "lt";
  }[]
) => {
  const {
    requests,
    count,
    from,
    to,
    isLoading: isRequestsLoading,
    refetch,
    isRefetching,
  } = useGetRequests(
    currentTimeFilter,
    currentPage,
    currentPageSize,
    sortBy,
    advancedFilters
  );

  const {
    properties,
    error,
    isLoading: isPropertiesLoading,
  } = useGetProperties();

  return {
    requests,
    count,
    from,
    to,
    isRequestsLoading,
    refetch,
    isRefetching,
    properties,
    error,
    isPropertiesLoading,
  };
};

export default useRequests;

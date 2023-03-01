import { useGetPromptValues } from "../../../services/hooks/promptValues";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetRequests } from "../../../services/hooks/requests";
import { Column } from "../../ThemedTableV2";
import { AdvancedFilterType } from "../users/usersPage";

const useRequestsPage = (
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

    isLoading: isPropertiesLoading,
  } = useGetProperties();

  const { values, isLoading: isValuesLoading } = useGetPromptValues();

  const isLoading =
    isRequestsLoading || isPropertiesLoading || isValuesLoading || isRefetching;

  return {
    requests,
    count,
    from,
    to,
    isLoading,
    refetch,
    properties,
    values,
  };
};

export default useRequestsPage;

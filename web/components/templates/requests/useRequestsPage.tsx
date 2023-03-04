import { useGetPromptValues } from "../../../services/hooks/promptValues";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetRequests } from "../../../services/hooks/requests";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { Column } from "../../ThemedTableV2";

const useRequestsPage = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter?: FilterNode
) => {
  const {
    requests,
    count,
    from,
    to,
    isLoading: isRequestsLoading,
    refetch,
    isRefetching,
  } = useGetRequests(currentPage, currentPageSize, advancedFilter);

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

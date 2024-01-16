import { useCallback } from "react";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetRequests } from "../../../services/hooks/requests";
import {
  filterListToTree,
  FilterNode,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import {
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import getNormalizedRequest from "./builder/requestBuilder";

const useRequestsPageV2 = (
  currentPage: number,
  currentPageSize: number,
  uiFilterIdxs: UIFilterRow[],
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  isCached: boolean,
  isLive: boolean
) => {
  const {
    properties,
    isLoading: isPropertiesLoading,
    propertyFilters,
    searchPropertyFilters,
  } = useGetProperties();

  const filterMap = (REQUEST_TABLE_FILTERS as SingleFilterDef<any>[]).concat(
    propertyFilters
  );

  const filter: FilterNode = {
    left: filterListToTree(
      filterUIToFilterLeafs(filterMap, uiFilterIdxs),
      "and"
    ),
    right: advancedFilter,
    operator: "and",
  };

  const { requests, count } = useGetRequests(
    currentPage,
    currentPageSize,
    filter,
    sortLeaf,
    isCached,
    isLive
  );

  const isDataLoading = requests.isLoading || isPropertiesLoading;

  const getNormalizedRequests = useCallback(() => {
    const rawRequests = requests.data?.data || [];
    return rawRequests.map((request) => {
      return getNormalizedRequest(request);
    });
  }, [requests]);

  const normalizedRequests = getNormalizedRequests();

  return {
    requests: normalizedRequests,
    count: count.data?.data,
    isDataLoading,
    isCountLoading: count.isLoading,
    properties,
    refetch: requests.refetch,
    searchPropertyFilters,
    filterMap,
    filter,
  };
};

export default useRequestsPageV2;

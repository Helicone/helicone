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
import {
  SortLeafRequest,
  SortLeafJob,
} from "../../../services/lib/sorts/requests/sorts";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { useGetRuns } from "../../../services/hooks/runs";

export const useRunPage = (
  currentPage: number,
  currentPageSize: number,
  isLive: boolean
) => {
  const { properties, isLoading: isPropertiesLoading } = useGetProperties();

  const { runs } = useGetRuns({
    currentPage,
    currentPageSize,
    advancedFilter: [],
    sortLeaf: undefined,
    isLive,
  });

  return {
    runs: runs,
    count: 100,
    loading: runs.loading || isPropertiesLoading,
    properties,
    refetch: runs.refetch,
  };
};

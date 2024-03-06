import { useCallback, useState } from "react";
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
  textWithSuggestions,
} from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import getNormalizedRequest from "./builder/requestBuilder";
import { useModels } from "../../../services/hooks/models";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { TimeFilter } from "../dashboard/dashboardPage";

const useRequestsPageV2 = (
  currentPage: number,
  currentPageSize: number,
  uiFilterIdxs: UIFilterRow[],
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  isCached: boolean,
  isLive: boolean
) => {
  const [timeFilter] = useState<TimeFilter>({
    start: getTimeIntervalAgo("all"),
    end: new Date(),
  });

  const {
    properties,
    isLoading: isPropertiesLoading,
    propertyFilters,
    searchPropertyFilters,
  } = useGetProperties();

  const { models, isLoading: isModelsLoading } = useModels(timeFilter, 50);

  const filterMap = (REQUEST_TABLE_FILTERS as SingleFilterDef<any>[]).concat(
    propertyFilters
  );

  // replace the model filter inside of the filterMap with the text suggestion model
  const modelFilterIdx = filterMap.findIndex(
    (filter) => filter.label === "Model"
  );
  if (modelFilterIdx !== -1) {
    filterMap[modelFilterIdx] = {
      label: "Model",
      operators: textWithSuggestions(
        models?.data
          ?.filter((model) => model.model)
          .map((model) => ({
            key: model.model,
            param: model.model,
          })) || []
      ),
      table: "response",
      column: "body_model",
      category: "request",
    };
  }

  // sort the model by name
  models?.data?.sort((a, b) => a.model.localeCompare(b.model));

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

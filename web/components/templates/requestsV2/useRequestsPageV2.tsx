import { useState } from "react";

import { HeliconeRequest } from "../../../lib/api/request/request";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { useModels } from "../../../services/hooks/models";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { useGetRequests } from "../../../services/hooks/requests";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  getPropertyFiltersV2,
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
  textWithSuggestions,
} from "../../../services/lib/filters/frontendFilterDefs";
import {
  filterUITreeToFilterNode,
  UIFilterRowTree,
} from "../../../services/lib/filters/uiFilterRowTree";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { TimeFilter } from "../dashboard/dashboardPage";
import getNormalizedRequest from "./builder/requestBuilder";

const useRequestsPageV2 = (
  currentPage: number,
  currentPageSize: number,
  uiFilterIdxs: UIFilterRowTree,
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
  } = useGetPropertiesV2(getPropertyFiltersV2);

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
        Array.from(
          new Set(
            models?.data
              ?.filter((model) => model.model)
              .map((model) => model.model)
          )
        ).map((modelName) => ({
          key: modelName,
          param: modelName,
        })) || []
      ),
      table: "request_response_rmt",
      column: "model",
      category: "request",
    };
  }

  // sort the model by name
  models?.data?.sort((a, b) => a.model.localeCompare(b.model));

  const filter: FilterNode = {
    left: filterUITreeToFilterNode(filterMap, uiFilterIdxs),
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

  return {
    normalizedRequests: getNormalizedRequests(requests.requests),
    count: count.data?.data,
    isDataLoading,
    isBodyLoading: requests.isLoading,
    isRefetching: requests.isRefetching,
    isCountLoading: count.isLoading,
    properties,
    refetch: requests.refetch,
    searchPropertyFilters,
    filterMap,
    filter,
  };
};

export function getNormalizedRequests(requests: HeliconeRequest[]) {
  return requests.map(getNormalizedRequest);
}

export default useRequestsPageV2;

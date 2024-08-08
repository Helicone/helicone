import { useMemo, useState } from "react";

import { HeliconeRequest } from "../../../lib/api/request/request";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { useModels } from "../../../services/hooks/models";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { useGetRequests } from "../../../services/hooks/requests";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  getPropertyFilters,
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
  } = useGetPropertiesV2(getPropertyFilters);

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
    left: filterUITreeToFilterNode(filterMap, uiFilterIdxs),
    right: advancedFilter,
    operator: "and",
  };

  const { requests, count, isBodyLoading } = useGetRequests(
    currentPage,
    currentPageSize,
    filter,
    sortLeaf,
    isCached,
    isLive
  );

  const isDataLoading = requests.isInitialLoading || isPropertiesLoading;

  const normalizedRequests = useMemo(() => {
    return getNormalizedRequests(requests.data?.data || []);
  }, [requests.data?.data]);

  return {
    normalizedRequests: normalizedRequests,
    count: count.data?.data,
    isDataLoading,
    isBodyLoading: isBodyLoading,
    isCountLoading: count.isLoading,
    properties,
    refetch: requests.refetch,
    remove: requests.remove,
    searchPropertyFilters,
    filterMap,
    filter,
  };
};

export function getNormalizedRequests(requests: HeliconeRequest[]) {
  return requests.map(getNormalizedRequest);
}

export default useRequestsPageV2;

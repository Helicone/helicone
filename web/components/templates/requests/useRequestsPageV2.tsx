import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { UIFilterRowTree } from "@/services/lib/filters/types";
import { TimeFilter } from "@/types/timeFilter";
import { useState } from "react";
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
import { filterUITreeToFilterNode } from "../../../services/lib/filters/uiFilterRowTree";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { useFilterAST } from "@/filterAST/context/filterContext";
import { toFilterNode } from "@/filterAST/toFilterNode";

const useRequestsPageV2 = (
  currentPage: number,
  currentPageSize: number,
  uiFilterIdxs: UIFilterRowTree,
  timeFilterNode: FilterNode,
  sortLeaf: SortLeafRequest,
  isCached: boolean,
  isLive: boolean,
  rateLimited?: boolean
) => {
  const filterStore = useFilterAST();
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
    Array.isArray(propertyFilters) ? propertyFilters : []
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

  const rateLimitFilterMapIndex = filterMap.findIndex(
    (filter: any) => filter.label?.trim() === "Helicone-Rate-Limit-Status"
  );

  let rateLimitFilterNode: FilterNode = "all";
  if (rateLimited && rateLimitFilterMapIndex !== -1) {
    rateLimitFilterNode = filterUITreeToFilterNode(filterMap, {
      filterMapIdx: rateLimitFilterMapIndex,
      operatorIdx: 0,
      value: "rate_limited",
    });
  }

  // sort the model by name
  models?.data?.sort((a, b) => a.model.localeCompare(b.model));

  const nonTimeFilters: FilterNode = {
    left: {
      left: filterUITreeToFilterNode(filterMap, uiFilterIdxs),
      right: filterStore.store.filter
        ? toFilterNode(filterStore.store.filter)
        : "all",
      operator: "and",
    },
    // Combine with only the conditional Rate Limit Filter
    right: rateLimitFilterNode,
    operator: "and",
  };

  // Combine with time filter last
  const filter: FilterNode = {
    left: nonTimeFilters,
    right: timeFilterNode,
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
    requests: requests.requests?.map(heliconeRequestToMappedContent) ?? [],
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
    rateLimitFilterNode,
  };
};

export default useRequestsPageV2;

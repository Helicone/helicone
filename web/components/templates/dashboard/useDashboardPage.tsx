import { UseQueryResult } from "@tanstack/react-query";
import { OverTimeRequestQueryParams } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result, ok, resultMap } from "../../../lib/result";
import {
  RequestsOverTime,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
import { CostOverTime } from "../../../pages/api/metrics/costOverTime";
import { ErrorOverTime } from "../../../pages/api/metrics/errorOverTime";

import { UIFilterRowTree } from "@/services/lib/filters/types";
import { useCallback, useMemo } from "react";
import { getTokensPerRequest } from "../../../lib/api/metrics/averageTokensPerRequest";
import { LatencyOverTime } from "../../../lib/api/metrics/getLatencyOverTime";
import { ThreatsOverTime } from "../../../lib/api/metrics/getThreatsOverTime";
import { TimeToFirstToken } from "../../../lib/api/metrics/getTimeToFirstToken";
import { UsersOverTime } from "../../../lib/api/metrics/getUsersOverTime";
import { UnPromise } from "../../../lib/tsxHelpers";
import { TokensOverTime } from "../../../pages/api/metrics/tokensOverTime";
import { useModels } from "../../../services/hooks/models";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import {
  FilterLeaf,
  FilterNode,
} from "../../../services/lib/filters/filterDefs";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  SingleFilterDef,
  getPropertyFiltersV2,
  textWithSuggestions,
} from "../../../services/lib/filters/frontendFilterDefs";
import { filterUITreeToFilterNode } from "../../../services/lib/filters/uiFilterRowTree";
import { useFilterStore } from "@/filterAST/store/filterStore";
import { toFilterNode } from "@/filterAST/toFilterNode";

export async function fetchDataOverTime<T>(
  timeFilter: {
    start: Date;
    end: Date;
  },
  userFilters: FilterLeaf[],
  dbIncrement: TimeIncrement,
  path: string
) {
  const body: OverTimeRequestQueryParams = {
    timeFilter: {
      start: timeFilter.start.toISOString(),
      end: timeFilter.end.toISOString(),
    },
    userFilters,
    dbIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
  };
  return await fetch(`/api/metrics/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then((res) => res.json() as Promise<Result<T[], string>>);
}

export interface DashboardPageData {
  timeFilter: {
    start: Date;
    end: Date;
  };
  uiFilters: UIFilterRowTree;
  apiKeyFilter: string | null;
  timeZoneDifference: number;
  dbIncrement: TimeIncrement;
  isLive: boolean;
}

export const useUIFilterConvert = (
  uiFilters: UIFilterRowTree,
  timeFilter: {
    start: Date;
    end: Date;
  }
) => {
  const properties = useGetPropertiesV2(getPropertyFiltersV2);

  const filterMap = useMemo(() => {
    return (DASHBOARD_PAGE_TABLE_FILTERS as SingleFilterDef<any>[]).concat(
      properties.propertyFilters
    );
  }, [properties.propertyFilters]);

  const userFilters = useMemo(
    () => filterUITreeToFilterNode(filterMap, uiFilters),
    [filterMap, uiFilters]
  );

  const { isLoading: isModelsLoading, models } = useModels(
    timeFilter,
    1000,
    userFilters
  );
  const topModels =
    models?.data?.sort((a, b) =>
      a.total_requests > b.total_requests ? -1 : 1
    ) ?? [];

  const { isLoading: isAllModelsLoading, models: allModels } = useModels(
    timeFilter,
    1000
  );

  const allModelsData = allModels?.data;
  allModels?.data?.sort((a, b) =>
    a.total_requests > b.total_requests ? -1 : 1
  ) ?? [];

  const updateModelFilter = useCallback(
    (filterMap: SingleFilterDef<any>[], allModelsData: any[]) => {
      const modelFilterIdx = filterMap.findIndex(
        (filter) => filter.label === "Model"
      );
      if (modelFilterIdx !== -1) {
        return [
          ...filterMap.slice(0, modelFilterIdx),
          {
            label: "Model",
            operators: textWithSuggestions(
              allModelsData
                ?.filter((model) => model.model)
                .map((model) => ({
                  key: model.model,
                  param: model.model,
                })) || []
            ),
            category: "request",
            table: "request_response_rmt",
            column: "model",
          },
          ...filterMap.slice(modelFilterIdx + 1),
        ];
      }
      return filterMap;
    },
    []
  );

  const sortedAllModelsData = useMemo(() => {
    return (
      allModelsData?.sort((a, b) =>
        a.total_requests > b.total_requests ? -1 : 1
      ) ?? []
    );
  }, [allModelsData]);

  const updatedFilterMap = useMemo(() => {
    return updateModelFilter(filterMap, sortedAllModelsData);
  }, [filterMap, sortedAllModelsData, updateModelFilter]);

  const filterStore = useFilterStore();

  return {
    properties,
    userFilters: {
      left: userFilters,
      right: filterStore.filter ? toFilterNode(filterStore.filter) : "all",
      operator: "and",
    } as FilterNode,
    filterMap: updatedFilterMap,
    allModelsData: sortedAllModelsData,
    isModelsLoading,
    models,
    topModels,
  };
};

export const useDashboardPage = ({
  timeFilter,
  uiFilters,
  timeZoneDifference,
  dbIncrement,
  isLive,
}: DashboardPageData) => {
  const {
    properties: {
      properties,
      isLoading: isPropertiesLoading,
      searchPropertyFilters,
    },
    filterMap,
    userFilters,
    allModelsData,
    isModelsLoading,
    topModels,
  } = useUIFilterConvert(uiFilters, timeFilter);

  const modelFilterIdx = filterMap.findIndex(
    (filter) => filter.label === "Model"
  );
  if (modelFilterIdx !== -1) {
    filterMap[modelFilterIdx] = {
      label: "Model",
      operators: textWithSuggestions(
        allModelsData
          ?.filter((model) => model.model)
          .map((model) => ({
            key: model.model,
            param: model.model,
          })) || []
      ),
      category: "request",
      table: "request_response_rmt",
      column: "model",
    };
  }

  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters,
    dbIncrement,
    timeZoneDifference,
  };

  const overTimeData = {
    promptTokensOverTime: useBackendMetricCall<
      Result<TokensOverTime[], string>
    >({
      params,
      endpoint: "/api/metrics/tokensOverTime",
      key: "errorOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({
            prompt_tokens: +d.prompt_tokens,
            completion_tokens: +d.completion_tokens,
            time: new Date(d.time),
          }))
        );
      },
    }),
    errors: useBackendMetricCall<Result<ErrorOverTime[], string>>({
      params,
      endpoint: "/api/metrics/errorOverTime",
      key: "errorOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
    requests: useBackendMetricCall<Result<RequestsOverTime[], string>>({
      params,
      endpoint: "/api/metrics/requestOverTime",
      key: "requestOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
    requestsWithStatus: useBackendMetricCall<
      Result<(RequestsOverTime & { status: number })[], string>
    >({
      params,
      endpoint: "/api/metrics/requestStatusOverTime",
      key: "requestStatusOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({
            count: +d.count,
            time: new Date(d.time),
            status: d.status,
          }))
        );
      },
    }),
    costs: useBackendMetricCall<Result<CostOverTime[], string>>({
      params,
      endpoint: "/api/metrics/costOverTime",
      key: "costOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ cost: +d.cost, time: new Date(d.time) }))
        );
      },
    }),
    latency: useBackendMetricCall<Result<LatencyOverTime[], string>>({
      params,
      endpoint: "/api/metrics/latencyOverTime",
      key: "latencyOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ duration: +d.duration, time: new Date(d.time) }))
        );
      },
    }),
    users: useBackendMetricCall<Result<UsersOverTime[], string>>({
      params,
      endpoint: "/api/metrics/usersOverTime",
      key: "usersOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
    timeToFirstToken: useBackendMetricCall<Result<TimeToFirstToken[], string>>({
      params,
      endpoint: "/api/metrics/timeToFirstToken",
      key: "timeToFirstToken",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ ttft: +d.ttft, time: new Date(d.time) }))
        );
      },
    }),
    threats: useBackendMetricCall<Result<ThreatsOverTime[], string>>({
      params,
      endpoint: "/api/metrics/threatsOverTime",
      key: "threatsOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
  };

  const metrics = {
    totalCost: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalCost/",
      isLive,
    }),
    totalRequests: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalRequests/",
      isLive,
    }),
    averageLatency: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/averageLatency/",
      isLive,
    }),
    averageTokensPerRequest: useBackendMetricCall<
      UnPromise<ReturnType<typeof getTokensPerRequest>>
    >({
      params,
      endpoint: "/api/metrics/averageTokensPerRequest/",
      isLive,
    }),
    activeUsers: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/activeUsers/",
      isLive,
    }),
    averageTimeToFirstToken: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/averageTimeToFirstToken/",
      isLive,
    }),
    totalThreats: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalThreats/",
      isLive,
    }),
  };

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching || isPropertiesLoading;
  }

  const isAnyLoading =
    Object.values(overTimeData).some(isLoading) ||
    Object.values(metrics).some(isLoading) ||
    isPropertiesLoading;

  return {
    filterMap,
    metrics,
    overTimeData,
    isAnyLoading,
    properties,
    searchPropertyFilters,
    refetch: () => {
      Object.values(overTimeData).forEach((x) => x.refetch());
      Object.values(metrics).forEach((x) => x.refetch());
    },
    remove: () => {
      Object.values(overTimeData).forEach((x) => x.remove());
      Object.values(metrics).forEach((x) => x.remove());
    },
    models: ok(topModels),
    isModelsLoading,
  };
};

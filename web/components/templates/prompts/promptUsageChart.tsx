import { SparkAreaChart } from "@tremor/react";
import { usePromptRequestsOverTime } from "../../../services/hooks/prompts/prompts";
import { BackendMetricsCall } from "../../../services/hooks/useBackendFunction";
import {
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { useState } from "react";
import { TimeFilter } from "../dashboard/dashboardPage";

interface PromptUsageChartProps {
  promptId: string;
}

const PromptUsageChart = (props: PromptUsageChartProps) => {
  const { promptId } = props;

  const getTimeFilter = () => {
    return {
      start: getTimeIntervalAgo("1m"),
      end: new Date(),
    };
  };

  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilter());

  const timeIncrement = getTimeInterval(timeFilter);

  const promptUsageFilterLeaf = {
    request_response_rmt: {
      properties: {
        "Helicone-Prompt-Id": {
          equals: promptId,
        },
      },
    },
  };

  const params: BackendMetricsCall<any>["params"] = {
    timeFilter: timeFilter,
    userFilters: {
      left: promptUsageFilterLeaf,
      operator: "and",
      right: "all",
    },
    dbIncrement: timeIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
  };

  const {
    data,
    isLoading: isPromptRequestsLoading,
    refetch,
    total,
  } = usePromptRequestsOverTime(params, "promptRequests" + promptId);

  return (
    <>
      {isPromptRequestsLoading ? (
        <div className="bg-gray-300 dark:bg-gray-700 h-6 w-16 animate-pulse" />
      ) : (
        <SparkAreaChart
          data={
            data?.data?.map((r) => ({
              date: getTimeMap(timeIncrement)(r.time),
              count: r.count,
            })) ?? []
          }
          index="date"
          categories={["count"]}
          colors={["cyan"]}
          className="h-8 -mb-2"
          curveType="monotone"
        />
      )}
    </>
  );
};

export default PromptUsageChart;

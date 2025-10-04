import { SparkAreaChart } from "@tremor/react";
import { usePromptRequestsOverTime } from "../../../services/hooks/prompts/prompts";
import { BackendMetricsCall } from "../../../services/hooks/useBackendFunction";
import {
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { useState } from "react";
import { TimeFilter } from "@/types/timeFilter";

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

  const [timeFilter] = useState<TimeFilter>(getTimeFilter());

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
  } = usePromptRequestsOverTime(params, "promptRequests" + promptId);

  return (
    <>
      {isPromptRequestsLoading ? (
        <div className="h-6 w-16 animate-pulse bg-gray-300 dark:bg-gray-700" />
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
          className="-mb-2 h-8"
          curveType="monotone"
        />
      )}
    </>
  );
};

export default PromptUsageChart;

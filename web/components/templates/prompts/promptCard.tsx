import { DocumentTextIcon } from "@heroicons/react/24/outline";
import {
  usePrompt,
  usePromptRequestsOverTime,
} from "../../../services/hooks/prompts/prompts";
import { AreaChart } from "@tremor/react";
import {
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useState } from "react";
import { TimeFilter } from "@/types/timeFilter";
import { BackendMetricsCall } from "../../../services/hooks/useBackendFunction";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import Link from "next/link";
import {
  FilterBranch,
  FilterLeaf,
} from "../../../services/lib/filters/filterDefs";
import { Badge } from "@/components/ui/badge";

interface PromptCardProps {
  prompt: {
    id: string;
    user_defined_id: string;
    description: string;
    pretty_name: string;
    major_version: number;
  };
}

const PromptCard = (props: PromptCardProps) => {
  const { prompt } = props;

  const { prompt: promptInfo, isLoading, refetch } = usePrompt(prompt.id);

  const getTimeFilter = () => {
    return {
      start: getTimeIntervalAgo("1m"),
      end: new Date(),
    };
  };

  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilter());

  const timeIncrement = getTimeInterval(timeFilter);

  const promptIdFilterLeaf: FilterLeaf = {
    request_response_rmt: {
      properties: {
        "Helicone-Prompt-Id": {
          equals: prompt.user_defined_id,
        },
      },
    },
  };

  const params: BackendMetricsCall<any>["params"] = {
    timeFilter: timeFilter,
    userFilters: {
      left: promptIdFilterLeaf,
      operator: "and",
      right: "all",
    } as FilterBranch,
    dbIncrement: timeIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
  };

  const {
    data,
    isLoading: isPromptRequestsLoading,
    total,
  } = usePromptRequestsOverTime(
    params,
    "promptRequests" + prompt.user_defined_id
  );

  return (
    <div className="bg-white w-full h-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-black p-4 flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <DocumentTextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <Link
          className="text-2xl font-semibold text-black dark:text-white truncate"
          href={"/prompts/" + prompt.id}
        >
          {promptInfo?.user_defined_id}
        </Link>
      </div>
      <p className="text-sm text-gray-500">
        Last Used:{" "}
        {new Date(promptInfo?.created_at || "").toLocaleString("en-US")}
      </p>
      <div className="pt-12 pb-4">
        {isPromptRequestsLoading ? (
          <div className="h-36 w-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
        ) : (
          <AreaChart
            className="h-36"
            data={
              data?.data?.map((r) => ({
                date: getTimeMap(timeIncrement)(r.time),
                count: r.count,
              })) ?? []
            }
            index="date"
            categories={["count"]}
            colors={["cyan"]}
            showYAxis={false}
            startEndOnly={true}
            showLegend={false}
            showGridLines={false}
            yAxisWidth={60}
            curveType="monotone"
            onValueChange={(v) => console.log(v)}
          />
        )}
      </div>

      <h3 className="text-black dark:text-white text-2xl">
        {new Intl.NumberFormat().format(total || 0)}
        <span className="text-gray-500 text-xs ml-2">
          requests in the last 30 days
        </span>
      </h3>
      <div className="flex flex-wrap items-center space-x-2">
        <Badge variant="secondary">{`${promptInfo?.major_version} major versions`}</Badge>
        <Badge variant="secondary">{`${promptInfo?.versions.length} versions`}</Badge>
      </div>
      <p className="text-sm text-gray-500">
        Created:{" "}
        {new Date(promptInfo?.created_at || "").toLocaleString("en-US")}
      </p>
    </div>
  );
};

export default PromptCard;

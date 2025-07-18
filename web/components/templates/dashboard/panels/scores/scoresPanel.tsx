import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Card, LineChart } from "@tremor/react";
import clsx from "clsx";
import { useScores } from "./useScores";
import { ScoresPanelProps } from "./ScoresPanelProps";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getTimeMap } from "@/lib/timeCalculations/constants";
import {
  getMockBooleanScoresOverTimeData,
  getMockScoresOverTimeData,
} from "../../mockDashboardData";
import DashboardChartTooltipContent from "../../DashboardChartTooltipContent";

export const ScoresPanel = (props: ScoresPanelProps) => {
  const { timeFilter, userFilters, dbIncrement, filterBool } = props;
  const org = useOrg();
  const shouldShowMockData = org?.currentOrg?.has_onboarded === false;

  const { scoresQuery, allScores, scoreKeys } = useScores({
    timeFilter,
    userFilters,
    dbIncrement,
    filterBool,
  });

  // If we should show mock data, prepare it in the format the component expects
  const mockScoreKeys = filterBool
    ? ["accurate", "helpful", "relevant"]
    : ["Feedback"];

  const mockAllScores = filterBool
    ? getMockBooleanScoresOverTimeData().data.map((item: any) => ({
        date: getTimeMap(dbIncrement)(item.time),
        accurate: item.positive_percentage / 100,
        helpful: (item.positive_percentage + 5) / 100,
        relevant: (item.positive_percentage - 5) / 100,
      }))
    : getMockScoresOverTimeData().data.map((item: any) => ({
        date: getTimeMap(dbIncrement)(item.time),
        Feedback: item.score,
      }));

  const displayScores = shouldShowMockData ? mockAllScores : allScores;
  const displayScoreKeys = shouldShowMockData ? mockScoreKeys : scoreKeys;

  return (
    <Card className="h-full w-full rounded-lg border border-slate-200 bg-white text-slate-950 !shadow-sm ring-0 dark:border-slate-800 dark:bg-black dark:text-slate-50">
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex w-full flex-col space-y-0.5">
          <p className="text-sm text-gray-500">
            {filterBool ? "Feedback / Bool Scores" : "Scores"}
          </p>
        </div>
      </div>

      <div
        className={clsx("p-2", "w-full")}
        style={{
          height: "212px",
        }}
      >
        {scoresQuery.isLoading && !shouldShowMockData ? (
          <div className="h-full w-full rounded-md bg-gray-200 pt-4 dark:bg-gray-800">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : (
          <LineChart
            customTooltip={DashboardChartTooltipContent}
            className="h-[14rem]"
            data={displayScores ?? []}
            index="date"
            categories={displayScoreKeys}
            colors={[
              "yellow",
              "red",
              "green",
              "blue",
              "orange",
              "indigo",
              "orange",
              "pink",
            ]}
            showYAxis={false}
            curveType="monotone"
            valueFormatter={(number: number | bigint) => {
              if (filterBool) {
                return `${new Intl.NumberFormat("us").format(
                  Number(number) * 100,
                )}%`;
              }
              return `${new Intl.NumberFormat("us").format(Number(number))}`;
            }}
          />
        )}
      </div>
    </Card>
  );
};

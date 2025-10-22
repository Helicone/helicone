import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useScores } from "./useScores";
import { ScoresPanelProps } from "./ScoresPanelProps";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getTimeMap } from "@/lib/timeCalculations/constants";
import {
  getMockBooleanScoresOverTimeData,
  getMockScoresOverTimeData,
} from "../../mockDashboardData";
import { CHART_COLORS } from "../../../../../lib/chartColors";

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

  // Create chart config dynamically based on score keys
  const chartConfig = displayScoreKeys.reduce((acc, key, index) => {
    const colorKeys = [CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.cyan, CHART_COLORS.pink, CHART_COLORS.orange];
    acc[key] = {
      label: key,
      color: colorKeys[index % colorKeys.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  // Check if we have any score keys or data
  const hasData = displayScoreKeys && displayScoreKeys.length > 0 && displayScores && displayScores.length > 0;

  return (
    <div className="flex h-full w-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex w-full flex-col space-y-0.5">
          <p className="text-sm text-muted-foreground">
            {filterBool ? "Feedback / Bool Scores" : "Scores"}
          </p>
        </div>
      </div>

      <div className="w-full pt-4">
        {scoresQuery.isLoading && !shouldShowMockData ? (
          <div className="flex h-[180px] w-full items-center justify-center bg-muted">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : !hasData ? (
          <div className="flex h-[180px] w-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No score data available</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[180px] w-full"
          >
            <AreaChart data={displayScores ?? []}>
              <defs>
                {displayScoreKeys.map((key) => (
                  <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={`var(--color-${key})`}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={`var(--color-${key})`}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={50}
              />
              <YAxis domain={[0, 'auto']} hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    valueFormatter={(value) => {
                      if (filterBool) {
                        return `${new Intl.NumberFormat("us").format(
                          Number(value) * 100,
                        )}%`;
                      }
                      return `${new Intl.NumberFormat("us").format(Number(value))}`;
                    }}
                  />
                }
              />
              {displayScoreKeys.map((key) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="monotone"
                  fill={`url(#fill${key})`}
                  stroke={`var(--color-${key})`}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
};

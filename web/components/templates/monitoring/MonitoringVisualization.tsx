import React from "react";
import { TimeSeriesChart } from "../evals/cards/TimeSeriesChart";
import { BarChart, DonutChart } from "@tremor/react";
import LoadingCard from "@/components/shared/LoadingCard";
import NoDataCard from "@/components/shared/NoDataCard";
import { useMonitoringConfigState } from "./store/monitoringConfigStore";
import { useEvaluators } from "../evals/EvaluatorHook";
import { useTimeFilterQuery } from "@/hooks/useTimeFilterQuery";
import OnlineEvaluatorCard from "./cards/OnlineEvaluatorCard";
import { useOnlineEvaluators } from "./hooks/useOnlineEvaluators";
import { useEvaluatorStatsWithFilters } from "./hooks/useEvaluatorStatsWithFilters";
import { H3, P } from "@/components/ui/typography";
import {
  isLLMChoiceConfig,
  isLLMRangeConfig,
  LLMJudgeConfig,
} from "../evals/hooks/useEvaluatorSubmit";

export enum ChartView {
  TIME = "time",
  DISTRIBUTION = "distribution",
  PIE = "pie",
}

const MonitoringVisualization: React.FC = () => {
  const { chartSelections, removeChartSelection } = useMonitoringConfigState();

  const { evaluators: evaluatorsQuery } = useEvaluators();
  const evaluators = evaluatorsQuery.data?.data?.data || [];

  if (chartSelections.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-10">
      {chartSelections.map((selection, index) => {
        const evaluator = evaluators.find(
          (e) => e.id === selection.evaluatorId
        );

        return (
          <React.Fragment
            key={`${selection.evaluatorId}-${selection.onlineEvaluatorId}`}
          >
            <EvaluatorDisplay
              selection={selection}
              evaluatorName={evaluator?.name || "Evaluator"}
              evaluatorType={evaluator?.scoring_type || ""}
              evaluatorConfig={evaluator?.judge_config as LLMJudgeConfig}
              onDelete={() => removeChartSelection(index)}
            />
            {index < chartSelections.length - 1 && (
              <div className="w-full px-4">
                <div className="border-t border-border/60 w-full"></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface EvaluatorDisplayProps {
  selection: {
    evaluatorId: string;
    onlineEvaluatorId: string;
    chartTypes: ChartView[];
  };
  evaluatorName: string;
  evaluatorType: string;
  evaluatorConfig: LLMJudgeConfig;
  onDelete: () => void;
}

const EvaluatorDisplay: React.FC<EvaluatorDisplayProps> = ({
  selection,
  evaluatorName,
  evaluatorType,
  evaluatorConfig,
  onDelete,
}) => {
  const { evaluatorId, onlineEvaluatorId, chartTypes } = selection;
  const { onlineEvaluators } = useOnlineEvaluators(evaluatorId);
  const onlineEvaluator = onlineEvaluators.find(
    (e) => e.id === onlineEvaluatorId
  );

  // Find the online evaluator and get its name
  const onlineEvaluatorObj = onlineEvaluators.find(
    (e) => e.id === onlineEvaluatorId
  );
  // Use actual name if available, otherwise use evaluator name + "Monitor"
  let onlineEvaluatorDisplayName =
    onlineEvaluatorObj?.name || `${evaluatorName} Monitor`;

  const { timeFilter } = useTimeFilterQuery();

  const {
    data: evaluatorStats,
    isLoading,
    isError,
  } = useEvaluatorStatsWithFilters(evaluatorId, timeFilter);

  const hasData =
    !isLoading &&
    evaluatorStats &&
    (evaluatorStats.timeSeriesData.length > 0 ||
      evaluatorStats.scoreDistribution.length > 0);

  return (
    <div className="flex flex-col space-y-6">
      {/* Evaluator Header Card */}
      <div className="bg-card rounded-lg shadow-sm border border-border/40">
        <OnlineEvaluatorCard
          evaluatorName={evaluatorName}
          evaluatorType={evaluatorType}
          onlineEvaluatorName={onlineEvaluatorDisplayName}
          config={
            (onlineEvaluator?.config || {
              sampleRate: 100,
              propertyFilters: [],
            }) as any
          }
          chartTypes={chartTypes}
          onDelete={onDelete}
          className="border-0 shadow-none"
          recentTrend={evaluatorStats?.recentTrend}
        />
      </div>

      {/* Charts Section */}
      {isLoading ? (
        <div className="w-full h-[300px] bg-card rounded-lg shadow-sm border border-border/40 flex items-center justify-center">
          <LoadingCard className="w-full h-full bg-transparent" />
        </div>
      ) : !hasData || isError || !evaluatorStats ? (
        <div className="w-full h-[300px] bg-card rounded-lg shadow-sm border border-border/40 flex items-center justify-center">
          <NoDataCard
            title="No evaluation data available"
            className="bg-transparent"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {chartTypes.map((chartType) => (
            <div key={chartType} className="w-full">
              {renderChart(
                chartType,
                evaluatorStats,
                onlineEvaluatorDisplayName,
                evaluatorConfig
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const renderChart = (
  chartType: ChartView,
  evaluatorStats: any,
  evaluatorName: string,
  evaluatorConfig: LLMJudgeConfig
) => {
  switch (chartType) {
    case "time":
      if (isLLMRangeConfig(evaluatorConfig)) {
        // Get the time range from the data
        const dates = evaluatorStats.timeSeriesData.map(
          (d: any) => new Date(d.date)
        );
        const timeRange = Math.abs(Math.max(...dates) - Math.min(...dates));
        const daysRange = timeRange / (1000 * 60 * 60 * 24); // Convert to days

        const formatDate = (dateString: string) => {
          const date = new Date(dateString);

          if (daysRange <= 3) {
            // Less than 3 days - show date, hours and minutes
            return `${
              date.getMonth() + 1
            }/${date.getDate()} ${date.getHours()}:${date
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
          } else if (daysRange <= 7) {
            // Between 3-7 days - show date and hours
            return `${
              date.getMonth() + 1
            }/${date.getDate()} ${date.getHours()}:00`;
          } else {
            // More than 7 days - show only date
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }
        };

        return (
          <div className="bg-card rounded-lg p-6 border border-border/40 shadow-sm">
            <H3 className="text-sm font-medium mb-4 text-foreground">
              {evaluatorName} Trend Chart
            </H3>
            <TimeSeriesChart
              timeSeriesData={evaluatorStats.timeSeriesData}
              className="h-[300px]"
              formatDate={formatDate}
            />
          </div>
        );
      }
      return (
        <div className="w-full h-[300px] bg-card rounded-lg p-6 border border-border/40 shadow-sm flex items-center justify-center text-muted-foreground">
          <P className="text-sm">Chart visualization not available</P>
        </div>
      );
    case "distribution":
      return (
        <div className="bg-card rounded-lg p-6 border border-border/40 shadow-sm">
          <H3 className="text-sm font-medium mb-4 text-foreground">
            {evaluatorName} Histogram
          </H3>
          <BarChart
            className="h-[300px]"
            data={evaluatorStats.scoreDistribution
              .map((d: any) => {
                if (isLLMChoiceConfig(evaluatorConfig)) {
                  const choice = evaluatorConfig.choices.find(
                    (c) => String(c.score) === d.range
                  );
                  // Only return data if we found a matching choice
                  return choice
                    ? {
                        range: choice.description,
                        count:
                          typeof d.count === "string"
                            ? parseInt(d.count)
                            : d.count,
                      }
                    : null;
                }
                return {
                  range: d.range,
                  count:
                    typeof d.count === "string" ? parseInt(d.count) : d.count,
                };
              })
              .filter((d: any): d is NonNullable<typeof d> => d !== null)}
            index="range"
            categories={["count"]}
            colors={["violet"]}
            showLegend={false}
            yAxisWidth={48}
          />
        </div>
      );
    case "pie":
      return (
        <div className="bg-card rounded-lg p-6 border border-border/40 shadow-sm">
          <H3 className="text-sm font-medium mb-4 text-foreground">
            {evaluatorName} Pie Chart
          </H3>
          <div className="flex items-center justify-center">
            <DonutChart
              className="h-[300px] max-w-md"
              data={evaluatorStats.scoreDistribution
                .map((d: any) => {
                  if (isLLMChoiceConfig(evaluatorConfig)) {
                    const choice = evaluatorConfig.choices.find(
                      (c) => String(c.score) === String(d.range)
                    );
                    return choice
                      ? {
                          name: choice.description,
                          value:
                            typeof d.count === "string"
                              ? parseInt(d.count)
                              : d.count,
                        }
                      : null;
                  }
                  return {
                    name: d.range,
                    value:
                      typeof d.count === "string" ? parseInt(d.count) : d.count,
                  };
                })
                .filter((d: any): d is NonNullable<typeof d> => d !== null)}
              category="value"
              index="name"
              colors={["violet", "indigo", "sky", "blue", "cyan"]}
              valueFormatter={(value) => `${value} evaluations`}
              showLabel={true}
              label="Score Distribution"
            />
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full h-[300px] bg-card rounded-lg p-6 border border-border/40 shadow-sm flex items-center justify-center text-muted-foreground">
          <P className="text-sm">Chart visualization not available</P>
        </div>
      );
  }
};

export default MonitoringVisualization;

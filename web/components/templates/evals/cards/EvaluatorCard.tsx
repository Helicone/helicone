import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EditIcon,
  PlayIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  MinusIcon,
  BarChart2Icon,
  LineChartIcon,
} from "lucide-react";
import { TypeBadge } from "./TypeBadge";
import { useEvaluatorStats } from "../hooks/useEvaluatorStats";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EvaluatorCardProps {
  evaluator: {
    id: string;
    name: string;
    scoreName?: string;
    type: string;
    scoring_type: string;
    stats?: {
      averageScore: number;
      totalUses: number;
    };
  };
  onEdit: (id: string) => void;
  onTest: () => void;
}

type ChartView = "time" | "distribution";

/**
 * Card component for displaying evaluator information
 */
export const EvaluatorCard: React.FC<EvaluatorCardProps> = ({
  evaluator,
  onEdit,
  onTest,
}) => {
  // Chart view state
  const [chartView, setChartView] = useState<ChartView>("time");

  // Fetch real stats data for this evaluator
  const { data: stats, isLoading, isError } = useEvaluatorStats(evaluator.id);

  // Render trend icon based on the trend data
  const renderTrendIcon = () => {
    if (isLoading || isError || !stats) return null;

    switch (stats.recentTrend) {
      case "up":
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-slate-500" />;
    }
  };

  // Safely access stats with fallbacks
  const displayStats = {
    averageScore: stats?.averageScore ?? 0,
    totalUses: stats?.totalUses ?? 0,
  };

  // Determine if we have any data
  const hasRealData =
    !isLoading &&
    stats &&
    (stats.timeSeriesData.length > 0 ||
      stats.scoreDistribution.length > 0 ||
      (typeof stats.totalUses === "number"
        ? stats.totalUses > 0
        : parseInt(String(stats.totalUses), 10) > 0));

  // Render the chart based on current view
  const renderChart = () => {
    if (isLoading) {
      return <Skeleton className="h-32 w-full" />;
    }

    switch (chartView) {
      case "time":
        return <TimeSeriesChart timeSeriesData={stats?.timeSeriesData || []} />;
      case "distribution":
      default:
        return (
          <ScoreDistributionChart
            distributionData={stats?.scoreDistribution || []}
          />
        );
    }
  };

  return (
    <Card
      key={evaluator.id}
      className="cursor-pointer rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={() => onEdit(evaluator.scoreName || evaluator.id)}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-medium">
            {evaluator.name}
          </CardTitle>
          <CardDescription className="mt-1 text-xs text-slate-500">
            {evaluator.scoring_type}
          </CardDescription>
        </div>
        <TypeBadge type={evaluator.type} />
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Chart visualization */}
        {renderChart()}

        {/* Chart type tabs - always show since we have fallback data */}
        <Tabs
          value={chartView}
          onValueChange={(value) => setChartView(value as ChartView)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="time" className="text-xs">
              <LineChartIcon className="mr-1 h-3 w-3" />
              Trend
            </TabsTrigger>
            <TabsTrigger value="distribution" className="text-xs">
              <BarChart2Icon className="mr-1 h-3 w-3" />
              Distribution
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats summary */}
        <div className="flex items-center justify-between text-sm">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </>
          ) : hasRealData ? (
            <>
              <span className="flex items-center gap-1 font-medium">
                Avg Score: {displayStats.averageScore.toFixed(1)}%
                {renderTrendIcon()}
              </span>
              <span className="text-slate-500">
                Uses: {displayStats.totalUses}
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">No data available</span>
              <span className="text-slate-500">Uses: 0</span>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pb-4 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex h-8 items-center gap-1 px-3"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(evaluator.scoreName || evaluator.id);
          }}
        >
          <EditIcon className="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex h-8 items-center gap-1 px-3"
          onClick={(e) => {
            e.stopPropagation();
            onTest();
          }}
        >
          <PlayIcon className="h-4 w-4" />
          Test
        </Button>
      </CardFooter>
    </Card>
  );
};

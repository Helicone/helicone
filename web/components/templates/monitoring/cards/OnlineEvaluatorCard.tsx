import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  ChartBar,
  Cog,
  LineChart,
  X,
  BarChart,
  PieChart,
  Filter,
  LayoutGrid,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
} from "lucide-react";
import { OnlineEvaluatorConfig } from "../hooks/useOnlineEvaluators";
import { ChartView } from "../MonitoringVisualization";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { P } from "@/components/ui/typography";

interface OnlineEvaluatorCardProps {
  evaluatorName: string;
  evaluatorType?: string;
  onlineEvaluatorName: string;
  config: OnlineEvaluatorConfig;
  chartTypes: ChartView[];
  onChartTypeClick?: (chartType: ChartView) => void;
  onDelete?: () => void;
  className?: string;
  recentTrend?: string;
}

const OnlineEvaluatorCard: React.FC<OnlineEvaluatorCardProps> = ({
  evaluatorName,
  evaluatorType,
  onlineEvaluatorName,
  config,
  chartTypes,
  onChartTypeClick,
  onDelete,
  className,
  recentTrend,
}) => {
  const hasFilters =
    config.propertyFilters && config.propertyFilters.length > 0;

  const renderTrendIcon = () => {
    if (!recentTrend) return null;

    switch (recentTrend) {
      case "up":
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Card className={`w-full bg-card h-auto relative ${className}`}>
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Trash2
              className="absolute top-4 right-4 h-5 w-5 text-destructive cursor-pointer"
              onClick={onDelete}
            />
          </TooltipTrigger>
          <TooltipContent>
            <P className="text-sm">Remove from dashboard</P>
          </TooltipContent>
        </Tooltip>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg flex items-center">
          <span className="text-primary mr-2">{onlineEvaluatorName}</span>
        </CardTitle>
        <Separator orientation="horizontal" className="mt-2" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column - Evaluator Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ChartBar className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <span className="font-medium">{evaluatorName}</span>
                {evaluatorType && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({evaluatorType})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Cog className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">
                {config.sampleRate}% request sampling
              </span>
            </div>

            <div className="flex items-start space-x-2">
              <Filter className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-muted-foreground">
                  {hasFilters
                    ? `${config.propertyFilters.length} property filter${
                        config.propertyFilters.length > 1 ? "s" : ""
                      }`
                    : "No property filters configured"}
                </span>

                {hasFilters && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.propertyFilters.map((filter, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {filter.key}: {filter.value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Chart Types */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2 mb-1">
              <LayoutGrid className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-medium">Configured Charts</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {chartTypes.includes(ChartView.TIME) && (
                <Badge variant="secondary" className="rounded-full">
                  <LineChart className="mr-1 h-3 w-3" />
                  Trend
                  {onChartTypeClick && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-3" />
                      <X
                        className="h-3 w-3 text-muted-foreground cursor-pointer"
                        onClick={() => onChartTypeClick(ChartView.TIME)}
                      />
                    </>
                  )}
                </Badge>
              )}

              {chartTypes.includes(ChartView.DISTRIBUTION) && (
                <Badge variant="secondary" className="rounded-full">
                  <BarChart className="mr-1 h-3 w-3" />
                  Histogram
                  {onChartTypeClick && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-3" />
                      <X
                        className="h-3 w-3 text-muted-foreground cursor-pointer"
                        onClick={() => onChartTypeClick(ChartView.DISTRIBUTION)}
                      />
                    </>
                  )}
                </Badge>
              )}

              {chartTypes.includes(ChartView.PIE) && (
                <Badge variant="secondary" className="rounded-full">
                  <PieChart className="mr-1 h-3 w-3" />
                  Pie
                  {onChartTypeClick && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-3" />
                      <X
                        className="h-3 w-3 text-muted-foreground cursor-pointer"
                        onClick={() => onChartTypeClick(ChartView.PIE)}
                      />
                    </>
                  )}
                </Badge>
              )}

              {chartTypes.length === 0 && (
                <span className="text-muted-foreground text-sm">
                  No charts configured
                </span>
              )}
            </div>

            {/* Trend indicator for LLM-RANGE evaluator type */}
            {evaluatorType === "LLM-RANGE" && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm font-medium">Avg Trend:</span>
                {renderTrendIcon()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineEvaluatorCard;

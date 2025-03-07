import React from "react";
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
} from "lucide-react";
import { MockVisualization } from "./MockVisualization";
import { TypeBadge } from "./TypeBadge";
import { useEvaluatorStats } from "../hooks/useEvaluatorStats";
import { Skeleton } from "@/components/ui/skeleton";

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

/**
 * Card component for displaying evaluator information
 */
export const EvaluatorCard: React.FC<EvaluatorCardProps> = ({
  evaluator,
  onEdit,
  onTest,
}) => {
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

  return (
    <Card
      key={evaluator.id}
      className="rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
      onClick={() => onEdit(evaluator.scoreName || evaluator.id)}
    >
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-xl font-medium">
            {evaluator.name}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            {evaluator.scoring_type}
          </CardDescription>
        </div>
        <TypeBadge type={evaluator.type} />
      </CardHeader>
      <CardContent className="pt-2">
        <MockVisualization type={evaluator.type} />
        <div className="flex justify-between items-center mt-3 text-sm">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </>
          ) : (
            <>
              <span className="font-medium flex items-center gap-1">
                Avg Score: {displayStats.averageScore.toFixed(1)}%
                {renderTrendIcon()}
              </span>
              <span className="text-slate-500">
                Uses: {displayStats.totalUses}
              </span>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4 pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 h-8 px-3"
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
          className="flex items-center gap-1 h-8 px-3"
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

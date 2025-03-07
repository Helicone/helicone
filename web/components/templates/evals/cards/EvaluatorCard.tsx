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
import { EditIcon, PlayIcon } from "lucide-react";
import { MockVisualization } from "./MockVisualization";
import { TypeBadge } from "./TypeBadge";

interface EvaluatorCardProps {
  evaluator: {
    id: string;
    name: string;
    scoreName?: string;
    type: string;
    scoring_type: string;
    stats: {
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
          <span className="font-medium">
            Avg Score: {evaluator.stats.averageScore.toFixed(1)}%
          </span>
          <span className="text-slate-500">
            Uses: {evaluator.stats.totalUses}
          </span>
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

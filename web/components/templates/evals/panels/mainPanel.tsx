import AuthHeader from "@/components/shared/authHeader";
import Link from "next/link";
import { useMemo } from "react";

// Import shadcn components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Import icons
import { ChartLineIcon, EditIcon, PlayIcon } from "lucide-react";
import { PiPlusBold } from "react-icons/pi";

// Import hooks and utilities
import { useEvaluators } from "../EvaluatorHook";
import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { useEvalPanelStore } from "../store/evalPanelStore";
import { getEvaluatorScoreName } from "../EvaluatorDetailsSheet";
import clsx from "clsx";

// Create a small mock visualization component for each card
const MockVisualization = ({ type }: { type: string }) => {
  // Different visualization styles based on evaluator type
  if (type === "LLM as a judge") {
    return (
      <div className="h-8 w-full flex items-end gap-[2px]">
        {[0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.8, 0.9, 1.0].map((height, i) => (
          <div
            key={i}
            className="bg-blue-400 rounded-sm w-full"
            style={{ height: `${height * 32}px` }}
          />
        ))}
      </div>
    );
  } else if (type === "Python") {
    return (
      <div className="h-8 w-full flex items-center">
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: "70%" }}></div>
        </div>
      </div>
    );
  } else {
    // Default visualization
    return (
      <div className="h-8 w-full flex items-end gap-[2px]">
        {[0.4, 0.6, 0.5, 0.8, 0.7, 0.4, 0.6, 0.7, 0.9, 0.5].map((height, i) => (
          <div
            key={i}
            className="bg-blue-400 rounded-sm w-full"
            style={{ height: `${height * 32}px` }}
          />
        ))}
      </div>
    );
  }
};

// Type badge component for consistent styling
const TypeBadge = ({ type }: { type: string }) => {
  let color = "";

  switch (type) {
    case "LLM as a judge":
      color = "bg-blue-100 text-blue-800";
      break;
    case "Python":
      color = "bg-green-100 text-green-800";
      break;
    case "LastMile":
      color = "bg-purple-100 text-purple-800";
      break;
    default:
      color = "bg-slate-100 text-slate-800";
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {type}
    </span>
  );
};

export const MainPanel = () => {
  const { evaluators } = useEvaluators();
  const { openCreatePanel, openEditPanel, openTestPanel, panels } =
    useEvalPanelStore();
  const org = useOrg();

  // Get a simplified list of evaluators from the API response
  const simpleEvaluators = useMemo(() => {
    return (
      evaluators.data?.data?.data?.map((evaluator) => {
        // Determine the evaluator type based on available properties
        let type = "Default";
        if (evaluator.llm_template) {
          type = "LLM as a judge";
        } else if (evaluator.code_template) {
          type = "Python";
        } else if (evaluator.last_mile_config) {
          type = "LastMile";
        }

        return {
          id: evaluator.id,
          name: evaluator.name,
          scoreName: getEvaluatorScoreName(
            evaluator.name,
            evaluator.scoring_type
          ),
          type,
          scoring_type: evaluator.scoring_type,
          // For now, mock some stats with random data
          stats: {
            averageScore: Math.random() * 100,
            totalUses: Math.floor(Math.random() * 1000),
            recentTrend: Math.random() > 0.5 ? "up" : "down",
          },
        };
      }) || []
    );
  }, [evaluators.data?.data?.data]);

  if (!org?.currentOrg?.tier) {
    return null;
  }

  if (org?.currentOrg?.tier === "free") {
    return (
      <div className="flex flex-col space-y-2 w-full h-screen items-center justify-center">
        <FeatureUpgradeCard
          title="Unlock Evaluators"
          featureName="Evaluators"
          headerTagline="Evaluate your prompts and models to drive improvements."
          icon={<ChartLineIcon className="h-4 w-4" />}
          highlightedFeature="Evaluators"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <AuthHeader
        title="Evaluators"
        actions={[
          <Button
            key="create-evaluator"
            onClick={() => openCreatePanel()}
            variant="outline"
            size="sm"
            className="gap-1 items-center"
          >
            <PiPlusBold className="h-3.5 w-3.5" />
            Create Evaluator
          </Button>,
        ]}
      />

      {evaluators.isLoading ? (
        // Loading state
        <div className="flex flex-col w-full gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="animate-pulse rounded-xl border shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </CardContent>
                <CardFooter>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : simpleEvaluators.length === 0 ? (
        // Empty state
        <div className="flex flex-col w-full justify-center items-center h-full">
          <div className="flex flex-col items-center max-w-3xl">
            <ChartLineIcon className="h-12 w-12 text-black dark:text-white" />
            <p className="text-xl text-black dark:text-white font-semibold mt-6">
              No evaluators yet
            </p>
            <p className="text-sm text-gray-500 max-w-sm mt-2 text-center">
              Create an evaluator to help you measure prompt performance and
              drive improvements.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" asChild>
                <Link href="https://docs.helicone.ai/features/advanced-usage/evals">
                  View Docs
                </Link>
              </Button>
              <Button
                variant="default"
                className="gap-2"
                onClick={() => openCreatePanel()}
              >
                <PiPlusBold className="h-4 w-4" />
                Create Evaluator
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Card grid view
        <div className="flex flex-col w-full gap-6 p-6">
          <div
            className={clsx(
              "grid gap-6",
              panels.length > 1
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {simpleEvaluators.map((evaluator) => (
              <Card
                key={evaluator.id}
                className="rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
                onClick={() =>
                  openEditPanel(evaluator.scoreName || evaluator.id)
                }
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
                      openEditPanel(evaluator.scoreName || evaluator.id);
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
                      // Open test panel
                      openTestPanel();
                    }}
                  >
                    <PlayIcon className="h-4 w-4" />
                    Test
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

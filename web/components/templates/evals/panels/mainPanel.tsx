import AuthHeader from "@/components/shared/authHeader";
import { TimeInterval, getTimeIntervalAgo } from "@/lib/timeCalculations/time";
import Link from "next/link";
import { Dispatch, SetStateAction, useMemo } from "react";

// Import shadcn components
import { Button } from "@/components/ui/button";

// Import Recharts components
import ThemedTable from "@/components/shared/themed/table/themedTable";

import { ChartLineIcon } from "lucide-react";

// Import Shadcn UI components for dropdown
import { useEvaluators } from "../EvaluatorHook";
import { INITIAL_COLUMNS } from "../EvaluratorColumns";

import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { getEvaluatorScoreName } from "../EvaluatorDetailsSheet";
import { PanelType } from "./types";
import { PiPlusBold } from "react-icons/pi";

export const MainPanel = ({
  setPanels,
  panels,
}: {
  setPanels: Dispatch<SetStateAction<PanelType[]>>;
  panels: PanelType[];
}) => {
  const {
    evalScores,
    evaluators: evaluators,
    scoreDistributions,
    defaultEvaluators,
    filterMap,
    searchPropertyFilters,
    setAdvancedFilters,
    advancedFilters,
    setTimeFilter,
    timeFilter,
    deleteEvaluator,
  } = useEvaluators();

  const org = useOrg();

  const evals = useMemo(() => {
    const allEvaluators =
      defaultEvaluators?.data?.data?.data?.map((evalRow) => {
        const evaluator = evaluators.data?.data?.data?.find(
          (x) => x.scoring_type === evalRow.name
        );

        let evalType = "Default";
        if (evaluator?.llm_template) {
          evalType = "LLM as a judge";
        } else if (evaluator?.code_template) {
          evalType = "Python";
        }
        return {
          ...evalRow,
          scoreDistribution:
            scoreDistributions?.data?.data?.data?.find(
              (s) => s.name === evalRow.name
            )?.distribution ?? [],
          valueType: evalRow.name.includes("-hcone-bool")
            ? "Boolean"
            : "# Number",
          type: evalType,
          id: evalRow.name,
        };
      }) ?? [];

    for (const evaluator of evaluators.data?.data?.data ?? []) {
      const scoreName = getEvaluatorScoreName(
        evaluator.name,
        evaluator.scoring_type
      );
      if (allEvaluators.find((e) => e.name === scoreName)) {
      } else {
        let evalType = "Default";
        if (evaluator?.llm_template) {
          evalType = "LLM as a judge";
        } else if (evaluator?.code_template) {
          evalType = "Python";
        }
        allEvaluators.push({
          averageOverTime: [],
          averageScore: 0,
          count: 0,
          id: evaluator.name,
          maxScore: 0,
          minScore: 0,
          name: evaluator.name,
          overTime: [],
          scoreDistribution: [],
          type: evalType,
          valueType: "# Number",
        });
      }
    }

    return allEvaluators;
  }, [
    defaultEvaluators?.data?.data?.data,
    scoreDistributions?.data?.data?.data,
    evaluators.data?.data?.data,
  ]);

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
      <AuthHeader title="Evaluators" actions={[]} />
      {!defaultEvaluators.isLoading && evals.length === 0 ? (
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
                variant="action"
                className="gap-2"
                onClick={() => {
                  setPanels([{ _type: "main" }, { _type: "create" }]);
                }}
              >
                <PiPlusBold className="h-4 w-4 mr-2" />
                Create Evaluator
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ThemedTable
            advancedFilters={{
              filterMap: filterMap,
              setAdvancedFilters: setAdvancedFilters,
              filters: advancedFilters,
              searchPropertyFilters: searchPropertyFilters,
            }}
            timeFilter={{
              currentTimeFilter: timeFilter,
              defaultValue: "all",
              onTimeSelectHandler: (key: TimeInterval, value: string) => {
                if ((key as string) === "custom") {
                  value = value.replace("custom:", "");
                  const start = new Date(value.split("_")[0]);
                  const end = new Date(value.split("_")[1]);
                  setTimeFilter({
                    start,
                    end,
                  });
                } else {
                  setTimeFilter({
                    start: getTimeIntervalAgo(key),
                    end: new Date(),
                  });
                }
              },
            }}
            onRowSelect={(row) => {
              setPanels((prev) => [
                { _type: "main" },
                { _type: "edit", selectedEvaluatorId: row.id ?? "" },
              ]);
            }}
            customButtons={[
              ...(panels.length > 1
                ? []
                : [
                    <Button
                      onClick={async () => {
                        setPanels([{ _type: "main" }, { _type: "create" }]);
                      }}
                      key="create-new-evaluator"
                      size="sm_sleek"
                      variant="outline"
                    >
                      Create New Evaluator
                    </Button>,
                  ]),
            ]}
            dataLoading={defaultEvaluators.isLoading}
            skeletonLoading={defaultEvaluators.isLoading}
            id="evals-table"
            defaultColumns={INITIAL_COLUMNS}
            defaultData={evals}
          />
        </>
      )}
    </div>
  );
};

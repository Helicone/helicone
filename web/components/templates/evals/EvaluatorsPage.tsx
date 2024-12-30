import { ChartBarIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";

// Import shadcn components
import { Button } from "@/components/ui/button";

// Import Recharts components
import ThemedTable from "@/components/shared/themed/table/themedTable";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChartLineIcon, Check, ChevronsUpDown } from "lucide-react";

// Import Shadcn UI components for dropdown
import { CreateNewEvaluator } from "@/components/shared/CreateNewEvaluator/CreateNewEvaluator";
import { EvalMetric, INITIAL_COLUMNS } from "./EvaluratorColumns";
import { useEvaluators } from "./EvaluatorHook";

import EvaluatorDetailsSheet, {
  getEvaluatorScoreName,
} from "./EvaluatorDetailsSheet";

const EvalsPage = () => {
  const {
    evalScores,
    evaluators: LLMAsJudgeEvaluators,
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

  const evals = useMemo(() => {
    const allEvaluators =
      defaultEvaluators?.data?.data?.data?.map((evalRow) => {
        const isLLMAsJudge = LLMAsJudgeEvaluators.data?.data?.data
          ?.map((e) => getEvaluatorScoreName(e.name, e.scoring_type))
          .includes(evalRow.name);
        return {
          ...evalRow,
          scoreDistribution:
            scoreDistributions?.data?.data?.data?.find(
              (s) => s.name === evalRow.name
            )?.distribution ?? [],
          valueType: evalRow.name.includes("-hcone-bool")
            ? "Boolean"
            : "# Number",
          type: isLLMAsJudge ? "LLM as a judge" : "Default",
          id: evalRow.name,
        };
      }) ?? [];

    for (const evaluator of LLMAsJudgeEvaluators.data?.data?.data ?? []) {
      const scoreName = getEvaluatorScoreName(
        evaluator.name,
        evaluator.scoring_type
      );
      if (allEvaluators.find((e) => e.name === scoreName)) {
      } else {
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
          type: "LLM as a judge",
          valueType: "# Number",
        });
      }
    }

    return allEvaluators;
  }, [
    defaultEvaluators?.data?.data?.data,
    scoreDistributions?.data?.data?.data,
    LLMAsJudgeEvaluators.data?.data?.data,
  ]);

  const [selectedEvaluator, setSelectedEvaluator] = useState<EvalMetric | null>(
    null
  );

  return (
    <div className="flex flex-col w-full h-screen">
      <AuthHeader title="Evaluators" actions={[]} />
      {defaultEvaluators.isLoading && <LoadingAnimation />}
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
              <CreateNewEvaluator
                key="create-new-evaluator"
                onSubmit={() => {
                  LLMAsJudgeEvaluators.refetch();
                }}
                buttonJSX={
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Evaluator
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <EvaluatorDetailsSheet
            selectedEvaluator={selectedEvaluator}
            setSelectedEvaluator={setSelectedEvaluator}
            LLMAsJudgeEvaluators={LLMAsJudgeEvaluators}
            deleteEvaluator={deleteEvaluator}
          />
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
              setSelectedEvaluator(row);
            }}
            customButtons={[
              <CreateNewEvaluator
                key="create-new-evaluator"
                onSubmit={() => {
                  LLMAsJudgeEvaluators.refetch();
                }}
              />,
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

export default EvalsPage;

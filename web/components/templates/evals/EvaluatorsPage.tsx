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
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/router";

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
      defaultEvaluators?.data?.data?.data?.map((evalRow) => ({
        ...evalRow,
        scoreDistribution:
          scoreDistributions?.data?.data?.data?.find(
            (s) => s.name === evalRow.name
          )?.distribution ?? [],
        valueType: evalRow.name.includes("-hcone-bool") ? "Boolean" : "Numeric",
        type: LLMAsJudgeEvaluators.data?.data?.data
          ?.map((e) => getEvaluatorScoreName(e.name, e.scoring_type))
          .includes(evalRow.name)
          ? "LLM as a judge"
          : "Default",
        id: evalRow.name,
      })) ?? [];

    // for (const evaluator of LLMAsJudgeEvaluators.data?.data?.data ?? []) {
    //   const scoreName =
    //     getEvaluatorScoreName(evaluator.name) +
    //     (evaluator.scoring_type === "LLM-BOOLEAN" ? "-hcone-bool" : "");
    //   if (allEvaluators.find((e) => e.name === scoreName)) {
    //   } else {
    //     allEvaluators.push({
    //       averageOverTime: [],
    //       averageScore: 0,
    //       count: 0,
    //       id: evaluator.name,
    //       maxScore: 0,
    //       minScore: 0,
    //       name: evaluator.name,
    //       overTime: [],
    //       scoreDistribution: [],
    //       type: "LLM as a judge",
    //       valueType: "Numeric",
    //     });
    //   }
    // }

    return allEvaluators;
  }, [
    defaultEvaluators?.data?.data?.data,
    scoreDistributions?.data?.data?.data,
    LLMAsJudgeEvaluators.data?.data?.data,
  ]);

  const [evalsToShow, setEvalsToShow] = useState<string[]>([]);
  const allEvalScores = evalScores.data?.data?.data || [];

  const handleSelectAll = () => {
    setEvalsToShow(allEvalScores);
  };

  const handleDeselectAll = () => {
    setEvalsToShow([]);
  };

  const [selectedEvaluator, setSelectedEvaluator] = useState<EvalMetric | null>(
    null
  );

  const router = useRouter();

  return (
    <>
      <AuthHeader
        title="Evaluators"
        actions={[
          <div key="select-evals" className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-between">
                  {evalsToShow.length > 0
                    ? `${evalsToShow.length} selected`
                    : "Select evals"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search evals..." />
                  <CommandEmpty>No eval found.</CommandEmpty>
                  <CommandGroup>
                    {allEvalScores.map((evalScore) => (
                      <CommandItem
                        key={evalScore}
                        onSelect={() => {
                          setEvalsToShow((prev) =>
                            prev.includes(evalScore)
                              ? prev.filter((item) => item !== evalScore)
                              : [...prev, evalScore]
                          );
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            evalsToShow.includes(evalScore)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {evalScore}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="link"
              onClick={
                evalsToShow.length > 0 ? handleDeselectAll : handleSelectAll
              }
            >
              {evalsToShow.length > 0 ? "Deselect All" : "Select All"}
            </Button>
          </div>,
        ]}
      />
      <div className="space-y-4">
        {defaultEvaluators.isLoading && <LoadingAnimation />}
        {!defaultEvaluators.isLoading && evals.length === 0 && (
          <div className="flex flex-col w-full mt-12 justify-center items-center">
            <div className="flex flex-col items-center max-w-3xl">
              <ChartBarIcon className="h-12 w-12 text-black dark:text-white" />
              <p className="text-xl text-black dark:text-white font-semibold mt-6">
                No Evals
              </p>
              <p className="text-sm text-gray-500 max-w-sm mt-2 text-center">
                Start adding evals to your requests to see them here.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="https://docs.helicone.ai/features/advanced-usage/evals">
                    View Docs
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/requests">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Evals
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
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
              onSubmit={() => {}}
            />,
          ]}
          dataLoading={defaultEvaluators.isLoading}
          skeletonLoading={defaultEvaluators.isLoading}
          id="evals-table"
          defaultColumns={INITIAL_COLUMNS}
          defaultData={evals}
        />
      </div>
    </>
  );
};

export default EvalsPage;

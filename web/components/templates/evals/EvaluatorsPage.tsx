import { ChartBarIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  UIFilterRowTree,
  getRootFilterNode,
} from "../../../services/lib/filters/uiFilterRowTree";
import { useOrg } from "../../layout/organizationContext";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import useSearchParams from "../../shared/utils/useSearchParams";
import { TimeFilter } from "../dashboard/dashboardPage";
import { useUIFilterConvert } from "../dashboard/useDashboardPage";

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
import { INITIAL_COLUMNS } from "./EvaluratorColumns";
import { useEvaluators } from "./EvaluatorHook";

const EvalsPage = () => {
  const {
    evalScores,
    scoreDistributions,
    defaultEvaluators,
    filterMap,
    searchPropertyFilters,
    setAdvancedFilters,
    advancedFilters,
    setTimeFilter,
    timeFilter,
  } = useEvaluators();

  const evals = defaultEvaluators?.data?.data?.data || [];

  const [evalsToShow, setEvalsToShow] = useState<string[]>([]);
  const allEvalScores = evalScores.data?.data?.data || [];

  const handleSelectAll = () => {
    setEvalsToShow(allEvalScores);
  };

  const handleDeselectAll = () => {
    setEvalsToShow([]);
  };

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
            router.push(`/evaluators/${row.name}`);
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
          defaultData={evals.map((evalRow) => ({
            ...evalRow,
            scoreDistribution:
              scoreDistributions?.data?.data?.data?.find(
                (s) => s.name === evalRow.name
              )?.distribution ?? [],
            type: evalRow.name.includes("-laj-") ? "LLM as a judge" : "Default",
            valueType: evalRow.name.includes("-hcone-bool")
              ? "Boolean"
              : "Numeric",
            id: evalRow.name,
          }))}
        />
      </div>
    </>
  );
};

export default EvalsPage;

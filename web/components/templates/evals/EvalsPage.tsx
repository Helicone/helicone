import { Badge } from "@/components/ui/badge";
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
import { ColumnDef } from "@tanstack/react-table";
import { Check, ChevronsUpDown } from "lucide-react";
import { AverageScoreChart } from "./charts/AverageScoreChart";
import { ScoreDistributionChart } from "./charts/ScoreDistributionChart";
import { ScoreDistributionChartPie } from "./charts/ScoreDistributionChartPie";
import { TracesChart } from "./charts/TracesChart";
import { useRouter } from "next/router";

// Import Shadcn UI components for dropdown
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { CreateNewEvaluator } from "@/components/shared/CreateNewEvaluator";

type EvalMetric = {
  name: string;
  type: string;
  valueType: string;
  averageScore: number;
  minScore: number;
  maxScore: number;
  count: number;
  overTime: { date: string; count: number }[];
  scoreDistribution: { lower: number; upper: number; value: number }[];
  averageOverTime: { date: string; value: number }[];
  id?: string;
};
export const INITIAL_COLUMNS: ColumnDef<EvalMetric>[] = [
  {
    accessorKey: "name",
    header: "Eval Name",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {info.getValue()
          ? `${info.getValue()}`.replaceAll("-hcone-bool", " ")
          : "No Eval Name"}
      </span>
    ),
    minSize: 300,
  },
  {
    accessorKey: "overTime",
    header: "Traces",
    cell: (info) => (
      <TracesChart
        overTime={info.getValue() as { date: string; count: number }[]}
      />
    ),
    minSize: 200,
  },
  {
    accessorKey: "averageOverTime",
    header: "Average Score",
    cell: (info) => (
      <AverageScoreChart
        averageOverTime={info.getValue() as { date: string; value: number }[]}
      />
    ),
    minSize: 200,
  },
  {
    accessorKey: "scoreDistribution",
    header: "Score Distribution",
    cell: (info) =>
      info.row.original.valueType !== "Boolean" ? (
        <ScoreDistributionChart
          distribution={
            info.getValue() as { lower: number; upper: number; value: number }[]
          }
        />
      ) : (
        <ScoreDistributionChartPie
          distribution={
            info.getValue() as { lower: number; upper: number; value: number }[]
          }
        />
      ),
    minSize: 100,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: (info) => (
      <Badge variant={"outline"}>{info.getValue() as string}</Badge>
    ),
    minSize: 300,
  },
  {
    accessorKey: "valueType",
    header: "Value Type",
    cell: (info) => (
      <Badge variant={"outline"}>{info.getValue() as string}</Badge>
    ),
    minSize: 300,
  },
  {
    accessorKey: "count",
    header: "Count",
    cell: (info) => <span>{Number(info.getValue()).toLocaleString()}</span>,
    meta: {
      sortKey: "count",
    },
  },
  {
    accessorKey: "averageScore",
    header: "Average Score",
    cell: (info) => <span>{Number(info.getValue()).toFixed(2)}</span>,
    meta: {
      sortKey: "averageScore",
    },
  },

  {
    accessorKey: "minScore",
    header: "Min Score",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    meta: {
      sortKey: "minScore",
    },
  },
  {
    accessorKey: "maxScore",
    header: "Max Score",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    meta: {
      sortKey: "maxScore",
    },
    minSize: 200,
  },
];

const EvalsPage = () => {
  const org = useOrg();

  const searchParams = useSearchParams();

  const getInterval = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const getTimeFilter = () => {
    const currentTimeFilter = searchParams.get("t");
    let range;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("24h");
      const end = new Date(currentTimeFilter.split("_")[2] || new Date());
      range = {
        start,
        end,
      };
    } else {
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "24h"),
        end: new Date(),
      };
    }
    return range;
  };

  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval
  );
  const [timeFilter, setTimeFilter] = useState(getTimeFilter());

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  const {
    userFilters,
    filterMap,
    properties: { searchPropertyFilters },
  } = useUIFilterConvert(advancedFilters, timeFilter);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["evals", org?.currentOrg?.id, timeFilter, userFilters],
    queryFn: async (query) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const timeFilter = query.queryKey[2] as TimeFilter;
      const filter = query.queryKey[3] as FilterNode;
      return jawn.POST("/v1/evals/query", {
        body: {
          filter: filter as any,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const { data: scoreDistributions } = useQuery({
    queryKey: [
      "scoreDistributions",
      org?.currentOrg?.id,
      timeFilter,
      userFilters,
    ],
    queryFn: async (query) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const timeFilter = query.queryKey[2] as TimeFilter;
      const filter = query.queryKey[3] as FilterNode;
      return jawn.POST("/v1/evals/score-distributions/query", {
        body: {
          filter: filter as any,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
  });

  const { data: evalScores } = useQuery({
    queryKey: ["evalScores", org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.GET("/v1/evals/scores");
    },
  });

  const evals = data?.data?.data || [];

  const [evalsToShow, setEvalsToShow] = useState<string[]>([]);
  const allEvalScores = evalScores?.data?.data || [];

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
        {isLoading && <LoadingAnimation />}
        {!isLoading && evals.length === 0 && (
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
                setInterval(key);
                setTimeFilter({
                  start,
                  end,
                });
              } else {
                setInterval(key);
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
          customButtons={[<CreateNewEvaluator key="create-new-evaluator" />]}
          dataLoading={isLoading}
          skeletonLoading={isLoading}
          id="evals-table"
          defaultColumns={INITIAL_COLUMNS}
          defaultData={evals.map((evalRow) => ({
            ...evalRow,
            scoreDistribution:
              scoreDistributions?.data?.data?.find(
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

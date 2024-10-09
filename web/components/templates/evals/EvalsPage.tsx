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
import ThemedTableHeader from "../../shared/themed/themedHeader";
import useSearchParams from "../../shared/utils/useSearchParams";
import { TimeFilter } from "../dashboard/dashboardPage";
import { useUIFilterConvert } from "../dashboard/useDashboardPage";
import { Badge } from "@/components/ui/badge";

// Import shadcn components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import Recharts components
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Col, Row } from "@/components/layout/common";
import { ArrowRightIcon, PencilIcon } from "lucide-react";
import { ScoreDistributionChart } from "./charts/ScoreDistributionChart";
import { TracesChart } from "./charts/TracesChart";
import { AverageScoreChart } from "./charts/AverageScoreChart";
import { formatNumber } from "@/components/shared/utils/formatNumber";
import ThemedTable from "@/components/shared/themed/table/themedTable";
import { ColumnDef } from "@tanstack/react-table";
import { ScoreDistributionChartPie } from "./charts/ScoreDistributionChartPie";

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
        averageOverTime={info.getValue() as { date: string; count: number }[]}
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

  return (
    <>
      <AuthHeader
        title="Evaluators"
        actions={[
          <div key="select-evals" className="flex items-center space-x-2">
            <Select
              value={evalsToShow}
              onValueChange={(value) => setEvalsToShow(value)}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select evals" />
              </SelectTrigger>
              <SelectContent>
                {allEvalScores.map((evalScore) => (
                  <SelectItem key={evalScore} value={evalScore}>
                    {evalScore}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

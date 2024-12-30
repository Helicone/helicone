import { Badge } from "@/components/ui/badge";

// Import shadcn components

// Import Recharts components
import { ColumnDef } from "@tanstack/react-table";
import { AverageScoreChart } from "./charts/AverageScoreChart";
import { ScoreDistributionChart } from "./charts/ScoreDistributionChart";
import { ScoreDistributionChartPie } from "./charts/ScoreDistributionChartPie";
import { TracesChart } from "./charts/TracesChart";

export type EvalMetric = {
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
    header: "Name",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {info.getValue()
          ? `${info.getValue()}`.replaceAll("-hcone-bool", " ")
          : "No Eval Name"}
      </span>
    ),
    minSize: 50,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: (info) => (
      <Badge variant={"outline"}>{info.getValue() as string}</Badge>
    ),
    minSize: 50,
  },
  {
    accessorKey: "valueType",
    header: "Value",
    cell: (info) => (
      <Badge variant={"outline"}>{info.getValue() as string}</Badge>
    ),
    minSize: 100,
    size: 100,
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

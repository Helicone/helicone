import { ColumnDef } from "@tanstack/react-table";

export const INITIAL_COLUMNS: ColumnDef<{
  property_value: string;
  total_requests: number;
  active_since: string;
  avg_completion_tokens_per_request: number;
  avg_latency_per_request: number;
  total_cost: number;
}>[] = [
  {
    accessorKey: "property_value",
    header: "Value",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "total_requests",
    header: "Requests",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "avg_completion_tokens_per_request",
    header: "Avg Completion Tokens / Req",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "avg_latency_per_request",
    header: "Avg Latency / Req",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "average_cost_per_request",
    header: "Avg Cost / Req",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "total_cost",
    header: "Total Cost",
    cell: (info) => info.getValue(),
  },
];

import { ColumnDef } from "@tanstack/react-table";

function formatNumber(num: number) {
  const numParts = num.toString().split(".");

  if (numParts.length > 1) {
    const decimalPlaces = numParts[1].length;
    if (decimalPlaces < 2) {
      return num.toFixed(2);
    } else if (decimalPlaces > 6) {
      return num.toFixed(6);
    } else {
      return num;
    }
  } else {
    return num.toFixed(2);
  }
}

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
    minSize: 300,
  },
  {
    accessorKey: "total_requests",
    header: "Requests",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "avg_completion_tokens_per_request",
    header: "Avg Completion Tokens / Req",
    cell: (info) => `${formatNumber(Number(info.getValue()))}`,
    minSize: 250,
  },
  {
    accessorKey: "avg_latency_per_request",
    header: "Avg Latency / Req",
    cell: (info) => `${formatNumber(Number(info.getValue()))}s`,
  },
  {
    accessorKey: "average_cost_per_request",
    header: "Avg Cost / Req",
    cell: (info) => `$${formatNumber(Number(info.getValue()))}`,
  },
  {
    accessorKey: "total_cost",
    header: "Total Cost",
    cell: (info) => `$${info.getValue()}`,
  },
];

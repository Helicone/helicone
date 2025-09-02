import { ColumnDef } from "@tanstack/react-table";
import { UserMetric } from "../../../lib/api/users/UserMetric";
import { getUSDateFromString } from "../../shared/utils/utils";
import { formatWithSignificantFigures, formatCost } from "@/components/shared/utils/smartNumberFormat";

export function formatNumber(num: number, decimals: number = 4) {
  // For cost values, use the formatCost function
  if (decimals === 6) {
    return formatCost(num);
  }
  
  // For other values, use the general formatting function
  return formatWithSignificantFigures(num, {
    maxSignificantFigures: decimals,
    minSignificantFigures: Math.min(2, decimals)
  });
}

export const INITIAL_COLUMNS: ColumnDef<UserMetric>[] = [
  {
    id: "user_id",
    accessorKey: "user_id",
    header: "User ID",
    cell: (info) => (
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {info.getValue() ? `${info.getValue()}` : "No User ID"}
      </span>
    ),
    minSize: 225,
  },
  {
    id: "cost",
    accessorKey: "cost",
    header: "Total Cost",
    cell: (info) => <span>${formatNumber(Number(info.getValue()), 6)}</span>,
    meta: {
      sortKey: "cost",
    },
  },
  {
    id: "active_for",
    accessorKey: "active_for",
    header: "Active For",
    cell: (info) => `${info.getValue()} days`,
    meta: {
      sortKey: "active_for",
    },
  },
  {
    id: "first_active",
    accessorKey: "first_active",
    header: "First Active",
    cell: (info) => getUSDateFromString(info.getValue() as string),
    meta: {
      sortKey: "first_active",
    },
    minSize: 200,
  },
  {
    id: "last_active",
    accessorKey: "last_active",
    header: "Last Active",
    cell: (info) => getUSDateFromString(info.getValue() as string),
    meta: {
      sortKey: "last_active",
    },
    minSize: 200,
  },
  {
    id: "total_requests",
    accessorKey: "total_requests",
    header: "Requests",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    meta: {
      sortKey: "total_requests",
    },
  },
  {
    id: "average_requests_per_day_active",
    accessorKey: "average_requests_per_day_active",
    header: "Avg Reqs / Day",
    cell: (info) => <span>{Number(info.getValue()).toFixed(2)}</span>,
    meta: {
      sortKey: "average_requests_per_day_active",
    },
    minSize: 200,
  },
  {
    id: "average_tokens_per_request",
    accessorKey: "average_tokens_per_request",
    header: "Avg Tokens / Req",
    cell: (info) => <span>{Number(info.getValue()).toFixed(2)}</span>,
    meta: {
      sortKey: "average_tokens_per_request",
    },
    minSize: 200,
  },
  {
    id: "total_completion_tokens",
    accessorKey: "total_completion_tokens",
    header: "Completion Tokens",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    meta: {
      sortKey: "total_completion_tokens",
    },
    minSize: 200,
  },
  {
    id: "total_prompt_tokens",
    accessorKey: "total_prompt_tokens",
    header: "Prompt Tokens",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    meta: {
      sortKey: "total_prompt_tokens",
    },
    minSize: 200,
  },
  {
    id: "rate_limited_count",
    accessorKey: "rate_limited_count",
    header: "Rate Limited Count",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    meta: {
      sortKey: "rate_limited_count",
    },
  },
];

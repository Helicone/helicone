import { ColumnDef } from "@tanstack/react-table";
import { UserMetric } from "../../../lib/api/users/users";
import { getUSDateFromString } from "../../shared/utils/utils";

export function formatNumber(num: number) {
  const numParts = num.toString().split(".");

  if (numParts.length > 1) {
    const decimalPlaces = numParts[1].length;
    if (decimalPlaces < 2) {
      return num.toFixed(2);
    } else if (decimalPlaces > 4) {
      return num.toFixed(4);
    } else {
      return num;
    }
  } else {
    return num.toFixed(2);
  }
}

export const INITIAL_COLUMNS: ColumnDef<UserMetric>[] = [
  {
    accessorKey: "user_id",
    header: "User ID",
    cell: (info) => (
      <span className="text-gray-900 font-medium">
        {info.getValue() ? `${info.getValue()}` : "No User ID"}
      </span>
    ),
    minSize: 225,
  },
  {
    accessorKey: "cost",
    header: "Total Cost",
    cell: (info) => <span>${formatNumber(Number(info.getValue()))}</span>,
    meta: {
      sortKey: "cost",
    },
  },
  {
    accessorKey: "active_for",
    header: "Active For",
    cell: (info) => `${info.getValue()} days`,
    meta: {
      sortKey: "active_for",
    },
  },
  {
    accessorKey: "last_active",
    header: "Last Active",
    cell: (info) => getUSDateFromString(info.getValue() as string),
    meta: {
      sortKey: "last_active",
    },
    minSize: 200,
  },
  {
    accessorKey: "total_requests",
    header: "Requests",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "total_requests",
    },
  },
  {
    accessorKey: "average_requests_per_day_active",
    header: "Avg Reqs / Day",
    cell: (info) => <span>{Number(info.getValue()).toFixed(2)}</span>,
    meta: {
      sortKey: "average_requests_per_day_active",
    },
    minSize: 200,
  },
  {
    accessorKey: "average_tokens_per_request",
    header: "Avg Tokens / Req",
    cell: (info) => <span>{Number(info.getValue()).toFixed(2)}</span>,
    meta: {
      sortKey: "average_tokens_per_request",
    },
    minSize: 200,
  },
];

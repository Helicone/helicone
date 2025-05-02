import { ColumnDef } from "@tanstack/react-table";
import { formatNumber } from "../../shared/utils/formatNumber";
import { getUSDateFromString } from "../../shared/utils/utils";

export const INITIAL_COLUMNS: ColumnDef<any>[] = [
  {
    id: "session_name",
    accessorKey: "session_name",
    header: "Session Name",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {info.getValue() ? `${info.getValue()}` : "No Session Name"}
      </span>
    ),
    meta: {},
  },
  {
    id: "session_id",
    accessorKey: "session_id",
    header: "Session ID",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {info.getValue() ? `${info.getValue()}` : "No Session ID"}
      </span>
    ),
    minSize: 225,
    meta: {},
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    header: "Created At",
    cell: (info) =>
      getUSDateFromString(convertToUSDateFormat(info.getValue() as string)),
    meta: {},
  },
  {
    id: "latest_request_created_at",
    accessorKey: "latest_request_created_at",
    header: "Latest Request",
    cell: (info) =>
      getUSDateFromString(convertToUSDateFormat(info.getValue() as string)),
    meta: {},
  },
  {
    id: "total_cost",
    accessorKey: "total_cost",
    header: "Cost",
    cell: (info) => `$${Number(info.getValue()).toLocaleString()}`,
    meta: {},
  },
  {
    id: "prompt_tokens",
    accessorKey: "prompt_tokens",
    header: "Prompt Tokens",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    meta: {},
  },
  {
    id: "completion_tokens",
    accessorKey: "completion_tokens",
    header: "Completion Tokens",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    minSize: 200,
    meta: {},
  },
  {
    id: "total_tokens",
    accessorKey: "total_tokens",
    header: "Total Tokens",
    cell: (info) => formatNumber(info.getValue() as number),
    meta: {},
  },
  {
    id: "total_requests",
    accessorKey: "total_requests",
    header: "Requests",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    meta: {},
  },
  {
    accessorKey: "avg_latency",
    header: "Avg Latency",
    cell: (info) => {
      const value = info.getValue() as number;
      return value ? `${(value * 1000).toFixed(0)}ms` : "-";
    },
  },
];

const convertToUSDateFormat = (date: string) => {
  const dateObj = new Date(date);
  const tzOffset = dateObj.getTimezoneOffset() * 60000;

  const localDateObj = new Date(dateObj.getTime() - tzOffset);
  const formattedDate =
    [
      ("0" + (localDateObj.getMonth() + 1)).slice(-2),
      ("0" + localDateObj.getDate()).slice(-2),
      localDateObj.getFullYear(),
    ].join("/") +
    " " +
    [
      ("0" + localDateObj.getHours()).slice(-2),
      ("0" + localDateObj.getMinutes()).slice(-2),
      ("0" + localDateObj.getSeconds()).slice(-2),
    ].join(":");

  return formattedDate;
};

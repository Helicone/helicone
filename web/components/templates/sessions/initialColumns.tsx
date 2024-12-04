import { ColumnDef } from "@tanstack/react-table";
import { getUSDateFromString } from "../../shared/utils/utils";

export const INITIAL_COLUMNS: ColumnDef<any>[] = [
  {
    accessorKey: "session_name",
    header: "Session Name",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {info.getValue() ? `${info.getValue()}` : "No Session Name"}
      </span>
    ),
  },
  {
    accessorKey: "session_id",
    header: "Session ID",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {info.getValue() ? `${info.getValue()}` : "No Session ID"}
      </span>
    ),
    minSize: 225,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: (info) =>
      getUSDateFromString(convertToUSDateFormat(info.getValue() as string)),
  },
  {
    accessorKey: "latest_request_created_at",
    header: "Latest Request",
    cell: (info) =>
      getUSDateFromString(convertToUSDateFormat(info.getValue() as string)),
  },
  {
    accessorKey: "total_cost",
    header: "Cost",
    cell: (info) => Number(info.getValue()).toLocaleString(),
  },
  {
    accessorKey: "prompt_tokens",
    header: "Prompt Tokens",
    cell: (info) => Number(info.getValue()).toLocaleString(),
  },
  {
    accessorKey: "completion_tokens",
    header: "Completion Tokens",
    cell: (info) => Number(info.getValue()).toLocaleString(),
    minSize: 200,
  },
  {
    accessorKey: "total_tokens",
    header: "Total Tokens",
    cell: (info) => Number(info.getValue()).toLocaleString(),
  },
  {
    accessorKey: "total_requests",
    header: "Requests",
    cell: (info) => Number(info.getValue()).toLocaleString(),
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

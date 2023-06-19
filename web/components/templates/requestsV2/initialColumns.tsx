import { ColumnDef } from "@tanstack/react-table";
import { getUSDate } from "../../shared/utils/utils";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import ModelPill from "./modelPill";

export const INITIAL_COLUMNS: ColumnDef<NormalizedRequest>[] = [
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: (info) => (
      <span className="text-gray-900 font-medium">
        {getUSDate(info.getValue() as string)}
      </span>
    ),
    meta: {
      sortKey: "created_at",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) =>
      (info.getValue() as number) === 200 ? (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          Success
        </span>
      ) : (
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          {`${info.getValue()} Error`}
        </span>
      ),
    size: 100,
  },
  {
    accessorKey: "requestText",
    header: "Request",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "request_prompt",
    },
  },
  {
    accessorKey: "responseText",
    header: "Response",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "response_text",
    },
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: (info) => <ModelPill model={info.getValue() as string} />,
    meta: {
      sortKey: "body_model",
    },
  },
  {
    accessorKey: "totalTokens",
    header: "Tokens",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "total_tokens",
    },
  },
  {
    accessorKey: "latency",
    header: "Latency",
    cell: (info) => <span>{Number(info.getValue()) / 1000}s</span>,
    meta: {
      sortKey: "latency",
    },
  },

  {
    accessorKey: "user",
    header: "User",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "user_id",
    },
  },
];

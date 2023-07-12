import { ColumnDef } from "@tanstack/react-table";
import { getUSDate } from "../../shared/utils/utils";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import ModelPill from "./modelPill";
import StatusBadge from "./statusBadge";

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

export const getInitialColumns: (
  isCached?: boolean
) => ColumnDef<NormalizedRequest>[] = (isCached = false) => [
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
    cell: (info) => {
      const { code, statusType } =
        info.getValue() as NormalizedRequest["status"];
      return (
        <StatusBadge
          statusType={isCached ? "cached" : statusType}
          errorCode={code}
        />
      );
    },
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
    header: "Total Tokens",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "total_tokens",
    },
  },
  {
    accessorKey: "promptTokens",
    header: "Prompt Tokens",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "prompt_tokens",
    },
  },
  {
    accessorKey: "completionTokens",
    header: "Completion Tokens",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "completion_tokens",
    },
    size: 175,
  },
  {
    accessorKey: "latency",
    header: "Latency",
    cell: (info) => (
      <span>{isCached ? 0 : Number(info.getValue()) / 1000}s</span>
    ),
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
  {
    accessorKey: "cost",
    header: "Cost",
    cell: (info) => (
      <span>${isCached ? 0 : formatNumber(Number(info.getValue()))}</span>
    ),
  },
];

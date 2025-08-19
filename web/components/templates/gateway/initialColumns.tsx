import {
  DEFAULT_UUID,
  MappedLLMRequest,
} from "@helicone-package/llm-mapper/types";
import CostPill from "../requests/costPill";
import { ColumnDef } from "@tanstack/react-table";
import { TooltipContent } from "@/components/ui/tooltip";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  get24HourFromString,
  getUSDateFromString,
} from "@/components/shared/utils/utils";
import StatusBadge from "../requests/statusBadge";
import ModelPill from "../requests/modelPill";
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

export const getInitialColumns = (): ColumnDef<MappedLLMRequest>[] => [
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created At",
    cell: (info) => {
      const value = info.row.original.heliconeMetadata.createdAt;
      return (
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <span className="cursor-default font-medium text-gray-900 dark:text-gray-100">
                {getUSDateFromString(value)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>{get24HourFromString(value)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    meta: {
      sortKey: "created_at",
    },
    minSize: 200,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: (info) => {
      const status = info.row.original.heliconeMetadata.status;
      const isCached =
        info.row.original.heliconeMetadata.cacheReferenceId &&
        info.row.original.heliconeMetadata.cacheReferenceId !== DEFAULT_UUID;

      if (!status) {
        return <span>{JSON.stringify(status)}</span>;
      }

      const { code, statusType } = status;
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
    id: "requestText",
    accessorKey: "requestText",
    header: "Request",
    cell: (info) => info.row.original.preview.request,
    meta: {
      sortKey: "request_prompt",
    },
  },
  {
    id: "responseText",
    accessorKey: "responseText",
    header: "Response",
    cell: (info) => info.row.original.preview.response,
    meta: {
      sortKey: "response_text",
    },
  },
  {
    id: "model",
    accessorKey: "model",
    header: "Model",
    cell: (info) => (
      <ModelPill
        model={info.row.original.model}
        provider={info.row.original.heliconeMetadata.provider}
      />
    ),
    meta: {
      sortKey: "body_model",
    },
    minSize: 200,
  },
  {
    id: "totalTokens",
    accessorKey: "totalTokens",
    header: "Total Tokens",
    cell: (info) => {
      const tokens = Number(info.row.original.heliconeMetadata.totalTokens);
      return <span>{tokens >= 0 ? tokens : "not found"}</span>;
    },
    meta: {
      sortKey: "total_tokens",
    },
  },
  {
    id: "promptTokens",
    accessorKey: "promptTokens",
    header: "Prompt Tokens",
    cell: (info) => {
      const tokens = Number(info.row.original.heliconeMetadata.promptTokens);
      return <span>{tokens >= 0 ? tokens : "not found"}</span>;
    },
    meta: {
      sortKey: "prompt_tokens",
    },
  },
  {
    id: "completionTokens",
    accessorKey: "completionTokens",
    header: "Completion Tokens",
    cell: (info) => {
      const tokens = Number(
        info.row.original.heliconeMetadata.completionTokens,
      );
      return <span>{tokens >= 0 ? tokens : "not found"}</span>;
    },
    meta: {
      sortKey: "completion_tokens",
    },
    size: 175,
  },
  {
    id: "latency",
    accessorKey: "latency",
    header: "Latency",
    cell: (info) => {
      const isCached =
        info.row.original.heliconeMetadata.cacheReferenceId !== DEFAULT_UUID;
      return (
        <span>
          {isCached
            ? 0
            : Number(info.row.original.heliconeMetadata.latency) / 1000}
          s
        </span>
      );
    },
    meta: {
      sortKey: "latency",
    },
  },
  {
    id: "user",
    accessorKey: "user",
    header: "User",
    cell: (info) => info.row.original.heliconeMetadata.user,
    meta: {
      sortKey: "user_id",
    },
  },
  {
    id: "cost",
    accessorKey: "cost",
    header: "Cost",
    cell: (info) => {
      const statusCode = info.row.original.heliconeMetadata.status.code;
      const num = Number(info.row.original.heliconeMetadata.cost);
      const isCached =
        info.row.original.heliconeMetadata.cacheReferenceId !== DEFAULT_UUID;

      if (Number(num) === 0 && !isCached && statusCode === 200) {
        return <CostPill />;
      }
      return <span>${formatNumber(num)}</span>;
    },
    meta: {
      sortKey: "cost",
    },
    size: 175,
  },
];

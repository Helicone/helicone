import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";
import { ColumnDef } from "@tanstack/react-table";
import { clsx } from "../../shared/clsx";
import {
  getUSDateFromString,
  get24HourFromString,
} from "../../shared/utils/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CostPill from "./costPill";
import { COUTNRY_CODE_DIRECTORY } from "./countryCodeDirectory";
import ModelPill from "./modelPill";
import ProviderPill from "./providerPill";
import StatusBadge from "./statusBadge";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";

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
    id: "provider",
    accessorKey: "provider",
    header: "Provider",
    cell: (info) => {
      return (
        <ProviderPill provider={info.row.original.heliconeMetadata.provider} />
      );
    },
  },
  {
    id: "requestText",
    accessorKey: "requestText",
    header: "Request",
    cell: (info) => info.row.original.preview.request,
    meta: {
      sortKey: "request_prompt",
    },
    minSize: 400,
  },
  {
    id: "responseText",
    accessorKey: "responseText",
    header: "Response",
    cell: (info) => info.row.original.preview.response,
    meta: {
      sortKey: "response_text",
    },
    minSize: 400,
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
    id: "reasoningTokens",
    accessorKey: "reasoningTokens",
    header: "Reasoning Tokens",
    cell: (info) => {
      const tokens = Number(
        info.row.original.heliconeMetadata.reasoningTokens,
      );
      return <span>{tokens >= 0 ? tokens : "not found"}</span>;
    },
    meta: {
      sortKey: "reasoning_tokens",
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
    id: "tfft",
    accessorKey: "tfft",
    header: "TFFT",
    cell: (info) => {
      const isCached =
        info.row.original.heliconeMetadata.cacheReferenceId !== DEFAULT_UUID;
      return (
        <span>
          {isCached
            ? 0
            : Number(info.row.original.heliconeMetadata.timeToFirstToken) /
              1000}
          s
        </span>
      );
    },
    meta: {
      sortKey: "time_to_first_token",
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
  {
    id: "feedback",
    accessorKey: "scores",
    header: "Feedback",
    cell: (info) => {
      const scores = info.row.original.heliconeMetadata.scores;
      const rating =
        scores && scores["helicone-score-feedback"]
          ? Number(scores["helicone-score-feedback"]) === 1
            ? true
            : false
          : null;
      if (rating === null) {
        return <span className="text-gray-500"></span>;
      }

      return (
        <span className={clsx(rating ? "text-green-500" : "text-red-500")}>
          {rating ? (
            <HandThumbUpIcon className="inline h-5 w-5" />
          ) : (
            <HandThumbDownIcon className="inline h-5 w-5" />
          )}
        </span>
      );
    },
  },
  {
    id: "promptId",
    accessorKey: "promptId",
    header: "Prompt ID",
    cell: (info) => {
      const promptId = info.row.original.heliconeMetadata.promptId;
      return <span>{promptId}</span>;
    },
  },
  {
    id: "country",
    accessorKey: "countryCode",
    header: "Country",
    cell: (info) => {
      const countryCode = info.row.original.heliconeMetadata.countryCode;
      const country = COUTNRY_CODE_DIRECTORY.find(
        (c) => c.isoCode === countryCode,
      );

      if (country === undefined) {
        return <span></span>;
      }

      return (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {country.emojiFlag} {country.country} ({country.isoCode})
        </span>
      );
    },
    minSize: 200,
  },
  {
    id: "promptCacheReadTokens",
    accessorKey: "promptCacheReadTokens",
    header: "Prompt Cache Read Tokens",
    cell: (info) => {
      const tokens = Number(
        info.row.original.heliconeMetadata.promptCacheReadTokens,
      );
      return <span>{tokens >= 0 ? tokens : "not found"}</span>;
    },
  },
  {
    id: "promptCacheWriteTokens",
    accessorKey: "promptCacheWriteTokens",
    header: "Prompt Cache Write Tokens",
    cell: (info) => {
      const tokens = Number(
        info.row.original.heliconeMetadata.promptCacheWriteTokens,
      );
      return <span>{tokens >= 0 ? tokens : "not found"}</span>;
    },
  },
  {
    id: "cacheEnabled",
    accessorKey: "cacheEnabled",
    header: "Cache Enabled",
    cell: (info) => {
      const cacheEnabled = info.row.original.heliconeMetadata.cacheEnabled;
      return cacheEnabled ? <span>Yes</span> : <span>No</span>;
    },
    size: 100,
  },
];

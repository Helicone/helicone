import { MappedLLMRequest } from "@/packages/cost/llm-mappers/types";
import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";
import { ColumnDef } from "@tanstack/react-table";
import { clsx } from "../../shared/clsx";
import { getUSDateFromString } from "../../shared/utils/utils";
import CostPill from "./costPill";
import { COUTNRY_CODE_DIRECTORY } from "./countryCodeDirectory";
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
) => ColumnDef<MappedLLMRequest>[] = (isCached = false) => [
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created At",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {getUSDateFromString(info.row.original.heliconeMetadata.createdAt)}
      </span>
    ),
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
    cell: (info) => <ModelPill model={info.row.original.model} />,
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
        info.row.original.heliconeMetadata.completionTokens
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
    cell: (info) => (
      <span>
        {isCached
          ? 0
          : Number(info.row.original.heliconeMetadata.latency) / 1000}
        s
      </span>
    ),
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

      if (Number(num) === 0 && !isCached && statusCode === 200) {
        return <CostPill />;
      } else if (Number(num) > 0) {
        return <span>${formatNumber(num)}</span>;
      }
      return <span></span>;
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
            <HandThumbUpIcon className="h-5 w-5 inline" />
          ) : (
            <HandThumbDownIcon className="h-5 w-5 inline" />
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
      const promptId = info.row.original.heliconeMetadata.customProperties?.[
        "Helicone-Prompt-Id"
      ] as string;
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
        (c) => c.isoCode === countryCode
      );

      if (country === undefined) {
        return <span></span>;
      }

      return (
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {country.emojiFlag} {country.country} ({country.isoCode})
        </span>
      );
    },
    minSize: 200,
  },
];

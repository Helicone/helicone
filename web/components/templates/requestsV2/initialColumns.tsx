import { ColumnDef } from "@tanstack/react-table";
import {
  getLocalDateFormat,
  getUSDateFromString,
} from "../../shared/utils/utils";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import ModelPill from "./modelPill";
import StatusBadge from "./statusBadge";
import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";
import { clsx } from "../../shared/clsx";
import CostPill from "./costPill";
import { COUTNRY_CODE_DIRECTORY } from "./countryCodeDirectory";
import { convertToUSDateFormat } from "../../shared/utils/dateConvertor";

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
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created At",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {getUSDateFromString(getLocalDateFormat(info.getValue() as string))}
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
      const status = info.getValue() as NormalizedRequest["status"];

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
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "request_prompt",
    },
  },
  {
    id: "responseText",
    accessorKey: "responseText",
    header: "Response",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "response_text",
    },
  },
  {
    id: "model",
    accessorKey: "model",
    header: "Model",
    cell: (info) => <ModelPill model={info.getValue() as string} />,
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
      const tokens = Number(info.getValue());
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
      const tokens = Number(info.getValue());
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
      const tokens = Number(info.getValue());
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
      <span>{isCached ? 0 : Number(info.getValue()) / 1000}s</span>
    ),
    meta: {
      sortKey: "latency",
    },
  },
  {
    id: "user",
    accessorKey: "user",
    header: "User",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "user_id",
    },
  },
  {
    id: "cost",
    accessorKey: "cost",
    header: "Cost",
    cell: (info) => {
      const statusCode = info.row.original.status.code;
      const num = Number(info.getValue());

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
      const scores = info.getValue() as NormalizedRequest["scores"];
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
      const promptId = info.getValue() as string;
      return <span>{promptId}</span>;
    },
  },
  {
    id: "country",
    accessorKey: "countryCode",
    header: "Country",
    cell: (info) => {
      const countryCode = info.getValue();
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

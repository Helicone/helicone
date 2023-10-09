import { ColumnDef } from "@tanstack/react-table";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { NormalizedRequest } from "../../requestsV2/builder/abstractRequestBuilder";
import ModelPill from "../../requestsV2/modelPill";
import StatusBadge from "../../requestsV2/statusBadge";

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
    minSize: 200,
  },
];

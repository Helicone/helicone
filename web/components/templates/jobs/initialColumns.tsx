import { ColumnDef } from "@tanstack/react-table";
import { getUSDate, getUSDateFromString } from "../../shared/utils/utils";
import StatusBadge from "./statusBadge";
import { HeliconeJob } from "../../../lib/api/graphql/schema/types/graphql";
import ModelPill from "../requestsV2/modelPill";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { JobStatus } from "../../../lib/sql/jobs";

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

export const getInitialColumns: () => ColumnDef<HeliconeJob>[] = (
  isCached = false
) => [
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: (info) => (
      <span className="text-gray-900 font-medium">
        {getUSDate(new Date(+(info.getValue() as number)))}
      </span>
    ),
    size: 200,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: (info) => info.getValue(),
    size: 200,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => (
      <>
        <StatusBadge statusType={info.getValue() as JobStatus} />
      </>
    ),
    meta: {
      sortKey: "response_text",
    },
  },
  {
    accessorKey: "timeout_seconds",
    header: "Timeout",
    cell: (info) => <span>{Number(info.getValue())}s</span>,
  },
  {
    accessorKey: "node_count",
    header: "Nodes",
    cell: (info) => info.getValue(),
    meta: {
      sortKey: "latency",
    },
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: (info) => <span>Coming soon</span>,
  },
];

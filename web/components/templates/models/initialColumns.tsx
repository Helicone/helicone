import { ColumnDef } from "@tanstack/react-table";
import { ModelMetric } from "../../../lib/api/models/models";
import ModelPill from "../requestsV2/modelPill";

export const INITIAL_COLUMNS: ColumnDef<ModelMetric>[] = [
  {
    accessorKey: "model",
    header: "Model",
    cell: (info) => (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {info.getValue() === "" ? (
          "n/a"
        ) : (
          <ModelPill model={info.getValue() as string} />
        )}
      </span>
    ),
    minSize: 300,
  },
  {
    accessorKey: "total_requests",
    header: "Requests",
    cell: (info) => info.getValue(),
    minSize: 200,
  },
  {
    accessorKey: "total_prompt_token",
    header: "Prompt Tokens",
    cell: (info) => info.getValue(),
    minSize: 200,
  },
  {
    accessorKey: "total_completion_tokens",
    header: "Completion Tokens",
    cell: (info) => info.getValue(),
    minSize: 200,
  },
  {
    accessorKey: "total_tokens",
    header: "Total Tokens",
    cell: (info) => info.getValue(),
    minSize: 200,
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: (info) => <span>{`$${info.getValue()}`}</span>,
  },
];

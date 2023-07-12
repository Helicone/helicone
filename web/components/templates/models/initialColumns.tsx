import { ColumnDef } from "@tanstack/react-table";
import { ModelMetric } from "../../../lib/api/models/models";

export const INITIAL_COLUMNS: ColumnDef<ModelMetric>[] = [
  {
    accessorKey: "model",
    header: "Model",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "total_requests",
    header: "Requests",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "total_prompt_token",
    header: "Prompt Tokens",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "total_completion_tokens",
    header: "Completion Tokens",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "total_tokens",
    header: "Total Tokens",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: (info) => <span>{`$${info.getValue()}`}</span>,
  },
];

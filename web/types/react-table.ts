import { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    category?: "Custom Property";
    sortKey?: string;
  }
}

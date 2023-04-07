import * as React from "react";

import {
  ColumnOrderState,
  ColumnSizingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { clsx } from "../../shared/clsx";
import { RequestWrapper } from "./useRequestsPage";
import { getUSDate } from "../../shared/utils/utils";
import { truncString } from "../../../lib/stringHelpers";
import { useRouter } from "next/router";
import {
  ArrowsPointingOutIcon,
  ArrowUpIcon,
  Bars3Icon,
  Square3Stack3DIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import SaveLayoutButton from "../../shared/themed/themedSaveLayout";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import DeleteLayoutButton from "../../shared/themed/themedDeleteLayout";
import { Json } from "../../../supabase/database.types";
import ThemedTabs from "../../shared/themed/themedTabs";
import ThemedTableV4, { Column } from "../../shared/themed/themedTableV4";

export type ColumnFormatted = {
  name: string;
  sizing: string;
};

interface RequestProps {
  data: RequestWrapper[];
  columns: Column[];
  page: number;
  from: number;
  to: number;
  count: number | null;
  columnSizing: {
    columnSizing: ColumnSizingState;
    setColumnSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>;
  };
  columnOrder: {
    columnOrder: ColumnOrderState;
    setColumnOrder: React.Dispatch<React.SetStateAction<ColumnOrderState>>;
  };
  onPageChangeHandler?: (page: number) => void;
  onPageSizeChangeHandler?: (pageSize: number) => void;
  onSelectHandler?: (row: any, idx: number) => void;
  onSortHandler?: (key: Column) => void;
}

const RequestTable = (props: RequestProps) => {
  const {
    data,
    columns,
    from,
    to,
    count,
    page,
    columnSizing: { columnSizing, setColumnSizing },
    columnOrder: { columnOrder, setColumnOrder },
    onPageChangeHandler,
    onPageSizeChangeHandler,
    onSelectHandler,
    onSortHandler,
  } = props;

  const resizeHandler: OnChangeFn<ColumnSizingState> = (newState) => {
    setColumnSizing(newState);
    // localStorage.setItem("requestsColumnSizing", JSON.stringify(columnSizing));
  };

  const orderHandler: OnChangeFn<ColumnOrderState> = (newState) => {
    setColumnOrder(newState);
    // localStorage.setItem("requestsColumnOrder", JSON.stringify(newState));
  };

  const [viewMode, setViewMode] = useState<"Condensed" | "Expanded">(
    "Condensed"
  );

  const columnHelper = createColumnHelper<RequestWrapper>();

  const filteredColumns = columns
    .filter((c) => c.active)
    .map((c) =>
      columnHelper.accessor(c.key as string, {
        cell: (info) =>
          c.format ? (
            <span className="whitespace-pre-wrap max-w-7xl break-all">
              {c.format(info.getValue(), viewMode)}
            </span>
          ) : (
            info.getValue()
          ),
        header: () => <span>{c.label}</span>,
        size: c.minWidth,
      })
    );

  const table = useReactTable({
    data,
    columns: filteredColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    onColumnSizingChange: resizeHandler,
    onColumnOrderChange: orderHandler,
    columnResizeMode: "onChange",
    state: {
      columnSizing,
      columnOrder,
    },
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <ThemedTableV4
      from={from}
      to={to}
      count={count || 0}
      page={page}
      columns={columns}
      tableCenterTableSize={table.getCenterTotalSize()}
      headerGroups={table.getHeaderGroups()}
      isResizingColumn={table.getState().columnSizingInfo.isResizingColumn}
      currentCols={table.getVisibleLeafColumns().map((c) => c.id)}
      rows={table.getRowModel().rows}
      onPageChangeHandler={onPageChangeHandler}
      onPageSizeChangeHandler={onPageSizeChangeHandler}
      onSelectHandler={onSelectHandler}
      onSortHandler={onSortHandler}
      orderHandler={orderHandler}
      setViewMode={setViewMode}
    />
  );
};

export default RequestTable;

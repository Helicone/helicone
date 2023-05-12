import {
  ColumnOrderState,
  ColumnSizingState,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { UserMetric } from "../../../lib/api/users/users";
import ThemedTableV4, { Column } from "../../shared/themed/themedTableV4";

interface UserTableProps {
  data: UserMetric[];
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

const UserTable = (props: UserTableProps) => {
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

  const columnHelper = createColumnHelper<UserMetric>();

  const filteredColumns = columns
    .filter((c) => c.active)
    .map((c) =>
      columnHelper.accessor(c.key, {
        cell: (info) =>
          c.format ? (
            <span className="whitespace-pre-wrap max-w-7xl break-all">
              {c.format(info.getValue(), "Condensed")}
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
      isCountLoading={false}
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
    />
  );
};

export default UserTable;

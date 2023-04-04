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
import { clsx } from "../clsx";
import { RequestWrapper } from "../../templates/requests/useRequestsPage";
import { getUSDate } from "../utils/utils";
import { truncString } from "../../../lib/stringHelpers";
import { useRouter } from "next/router";
import { Column } from "../../ThemedTableV2";
import {
  ArrowUpIcon,
  Bars3Icon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import SaveLayoutButton from "./themedSaveLayout";
import { UIFilterRow } from "./themedAdvancedFilters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { useLocalStorageState } from "../../../services/hooks/localStorage";
import ThemedDropdown from "./themedDropdown";

export type ColumnFormatted = {
  name: string;
  sizing: string;
};

// function formatColumns(
//   columnSizing: ColumnSizingState,
//   columnOrder: ColumnOrderState,
//   sortColumns: Column[]
// ): ColumnFormatted[] {
//   // Filter active columns
//   const activeColumns = sortColumns.filter((column) => column.active);

//   // Create a map with keys as column names and values as Column objects
//   const columnMap = new Map<string, Column>(
//     activeColumns.map((column) => [column.key, column])
//   );

//   // Sort the active columns based on the columnOrder
//   const sortedActiveColumns = columnOrder
//     .filter((columnName) => columnMap.has(columnName))
//     .map((columnName) => columnMap.get(columnName)!);

//   // Add the columns not present in columnOrder to the end of the list
//   const remainingColumns = activeColumns.filter(
//     (column) => !columnOrder.includes(column.key)
//   );
//   sortedActiveColumns.push(...remainingColumns);

//   // Create the ColumnFormatted array
//   const formattedColumns: ColumnFormatted[] = sortedActiveColumns.map(
//     (column) => ({
//       name: column.label,
//       sizing: columnSizing[column.key]?.toString() || null,
//     })
//   );

//   console.log("LAYOUT FINAL", formattedColumns);

//   return formattedColumns;
// }

interface ThemedTableV3Props {
  data: RequestWrapper[];
  columns: any[]; // abstract this to a <T>
  sortColumns: Column[];
  page: number;
  from: number;
  to: number;
  count: number | null;
  advancedFilters: UIFilterRow[];
  timeFilter: FilterNode;
  columnSizing: {
    columnSizing: ColumnSizingState;
    setColumnSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>;
  };
  columnOrder: {
    columnOrder: ColumnOrderState;
    setColumnOrder: React.Dispatch<React.SetStateAction<ColumnOrderState>>;
  };
  saveLayout: (name: string) => void;
  setLayout: (name: string) => void;
  layouts: string[];
  onPageChangeHandler?: (page: number) => void;
  onPageSizeChangeHandler?: (pageSize: number) => void;
  onSelectHandler?: (row: any, idx: number) => void;
  onSortHandler?: (key: any) => void; // use the same type as the column type above
}

const ThemedTableV3 = (props: ThemedTableV3Props) => {
  const {
    data,
    columns,
    sortColumns,
    from,
    to,
    count,
    page,
    advancedFilters,
    timeFilter,
    columnSizing: { columnSizing, setColumnSizing },
    columnOrder: { columnOrder, setColumnOrder },
    onPageChangeHandler,
    onPageSizeChangeHandler,
    onSelectHandler,
    onSortHandler,
    saveLayout,
    setLayout,
    layouts,
  } = props;

  console.log(
    "LAYOUT COLUMN SIZING",
    columnSizing,
    columnOrder,
    columns,
    sortColumns,
    advancedFilters,
    timeFilter
  );

  const resizeHandler: OnChangeFn<ColumnSizingState> = (newState) => {
    setColumnSizing(newState);
    localStorage.setItem("requestsColumnSizing", JSON.stringify(columnSizing));
  };

  const orderHandler: OnChangeFn<ColumnOrderState> = (newState) => {
    setColumnOrder(newState);
    localStorage.setItem("requestsColumnOrder", JSON.stringify(newState));
  };

  const router = useRouter();
  const hasPrevious = page > 1;
  const hasNext = to <= count!;

  const table = useReactTable({
    data,
    columns,
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

  let columnBeingDragged: number;

  return (
    <div className="space-y-2">
      <div className="w-full flex flex-row justify-between items-end">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{from + 1}</span> to{" "}
          <span className="font-medium">{Math.min(to, count as number)}</span>{" "}
          of <span className="font-medium">{count}</span> results
        </p>

        <div className="flex flex-row space-x-2 items">
          <SaveLayoutButton saveLayout={saveLayout} />
          <ThemedDropdown
            options={layouts.map((layout, i) => ({
              label: layout,
              value: i,
            }))}
            onSelect={(idx: number) => setLayout(layouts[idx])}
            selectedValue={1}
            align="right"
          />
        </div>
      </div>

      {columns.length < 1 ? (
        <div className="w-full h-48 items-center justify-center align-middle flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm p-2">
          <TableCellsIcon className="h-12 w-12 text-gray-500" />
          <p className="italic text-gray-500">No columns selected</p>
        </div>
      ) : (
        <div className="overflow-x-auto font-sans min-w-full">
          <table
            {...{
              style: {
                width: table.getCenterTotalSize(),
              },
            }}
            className="inline-block w-full bg-white border border-gray-200 rounded-lg shadow-sm p-2"
          >
            <thead className="text-left text-sm font-semibold text-gray-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => {
                    const currentCol = sortColumns.find(
                      (col) => col.key === header.id
                    );
                    return (
                      <th
                        className="py-2.5 pl-6 pr-4 text-left text-sm font-semibold text-gray-900 hover:cursor-pointer"
                        key={header.id}
                        {...{
                          colSpan: header.colSpan,
                          style: {
                            width: header.getSize(),
                          },
                        }}
                        data-column-index={header.index}
                        draggable={
                          !table.getState().columnSizingInfo.isResizingColumn
                        }
                        onDragStart={(e) => {
                          columnBeingDragged = Number(
                            e.currentTarget.dataset.columnIndex
                          );
                        }}
                        onDragOver={(e): void => {
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const newPosition = Number(
                            e.currentTarget.dataset.columnIndex
                          );
                          const currentCols = table
                            .getVisibleLeafColumns()
                            .map((c) => c.id);
                          const colToBeMoved = currentCols.splice(
                            columnBeingDragged,
                            1
                          );

                          currentCols.splice(newPosition, 0, colToBeMoved[0]);
                          orderHandler(currentCols);
                          // table.setColumnOrder(currentCols);
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        <button
                          onClick={() =>
                            header.column.getToggleSortingHandler()
                          }
                          className={clsx(
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            "resizer pl-4 pr-2 mr-4 w-4"
                          )}
                          {...{
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                          }}
                        >
                          <div
                            className={clsx(
                              header.column.getIsResizing()
                                ? "bg-blue-700"
                                : "bg-gray-500",
                              "h-full w-1"
                            )}
                          />
                        </button>
                        <button
                          onClick={() => {
                            if (onSortHandler) {
                              onSortHandler(currentCol);
                            }
                          }}
                          className="text-gray-700 hover:text-gray-900 hover:scale-105 ml-0.5"
                        >
                          {currentCol?.sortBy === "asc" ? (
                            <ArrowUpIcon className="h-3 w-3 ml-1 transition ease-in-out duration-300 " />
                          ) : (
                            <ArrowUpIcon className="h-3 w-3 ml-1 transform rotate-180 transition ease-in-out duration-300 " />
                          )}
                        </button>
                        <div className="self-end mt-[1px] h-4 w-2.5 inline-grid grid-cols-2 justify-between hide absolute left-2 mr-2 items-center">
                          <span className="h-[3px] w-[3px] bg-gray-400 rounded-full"></span>
                          <span className="h-[3px] w-[3px] bg-gray-400 rounded-full"></span>
                          <span className="h-[3px] w-[3px] bg-gray-400 rounded-full"></span>
                          <span className="h-[3px] w-[3px] bg-gray-400 rounded-full"></span>
                          <span className="h-[3px] w-[3px] bg-gray-400 rounded-full"></span>
                          <span className="h-[3px] w-[3px] bg-gray-400 rounded-full"></span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, idx) => {
                const hasError = row.original.error;
                return (
                  <tr
                    key={row.id}
                    className={clsx(
                      hasError
                        ? "bg-red-100 hover:bg-red-200"
                        : "hover:bg-gray-100",
                      "border-t border-gray-300",
                      "hover:cursor-pointer"
                    )}
                    onClick={() =>
                      onSelectHandler && onSelectHandler(row.original, idx)
                    }
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <td
                        key={cell.id}
                        className={clsx(
                          idx === 0
                            ? "font-medium text-gray-900"
                            : "font-normal",
                          "pl-6 pr-4 py-2.5 text-sm text-gray-700 align-top"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="flex items-center justify-betweenpy-2"
        aria-label="Pagination"
      >
        <div className="flex flex-row items-center gap-2">
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Page Size:
          </label>
          <select
            id="location"
            name="location"
            className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-6 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            defaultValue={router.query.page_size}
            onChange={(e) => {
              router.query.page_size = e.target.value;
              router.push(router);
              onPageSizeChangeHandler &&
                onPageSizeChangeHandler(parseInt(e.target.value, 10));
            }}
          >
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
        </div>
        <div className="flex flex-1 justify-end">
          <button
            onClick={() => {
              router.query.page = (page - 1).toString();
              router.push(router);
              onPageChangeHandler && onPageChangeHandler(page - 1);
            }}
            disabled={!hasPrevious}
            className={clsx(
              !hasPrevious
                ? "bg-gray-100 hover:cursor-not-allowed"
                : "hover:bg-gray-50",
              "relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            )}
          >
            Previous
          </button>
          <button
            onClick={() => {
              router.query.page = (page + 1).toString();
              router.push(router);
              onPageChangeHandler && onPageChangeHandler(page + 1);
            }}
            disabled={!hasNext}
            className={clsx(
              !hasNext
                ? "bg-gray-100 hover:cursor-not-allowed"
                : "hover:bg-gray-50",
              "relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemedTableV3;

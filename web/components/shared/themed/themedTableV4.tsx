import {
  ArrowsPointingOutIcon,
  ArrowUpIcon,
  Square3Stack3DIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  ColumnOrderState,
  ColumnSizingState,
  flexRender,
  HeaderGroup,
  OnChangeFn,
  Row,
} from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ColumnType } from "../../../services/lib/filters/frontendFilterDefs";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import { SortLeafUsers } from "../../../services/lib/sorts/users/sorts";
import { RequestWrapper } from "../../templates/requests/useRequestsPage";
import { clsx } from "../clsx";
import ThemedTabs from "./themedTabs";

export interface Column {
  key: any;
  label: string;
  active: boolean;
  type?: ColumnType;
  filter?: boolean;
  sortBy?: SortDirection;
  columnOrigin?: "property" | "value" | "feedback";
  minWidth?: number;
  align?: "center" | "inherit" | "left" | "right" | "justify";
  toSortLeaf?: (direction: SortDirection) => SortLeafRequest | SortLeafUsers;
  format?: (value: any, mode: "Condensed" | "Expanded") => string;
}

interface ThemedTableV4Props<T> {
  from: number;
  to: number;
  count: number;
  isCountLoading: boolean;
  page: number;
  columns: Column[];
  tableCenterTableSize: number;
  headerGroups: HeaderGroup<T>[];
  isResizingColumn: string | false;
  currentCols: string[];
  rows: Row<T>[];
  onSortHandler?: (key: Column) => void;
  onSelectHandler?: (row: any, idx: number) => void;
  onPageSizeChangeHandler?: (pageSize: number) => void;
  onPageChangeHandler?: (page: number) => void;
  orderHandler?: (newState: ColumnOrderState) => void;
  setViewMode?: React.Dispatch<React.SetStateAction<"Condensed" | "Expanded">>;
}

export default function ThemedTableV4<T>(props: ThemedTableV4Props<T>) {
  const {
    from,
    to,
    count,
    isCountLoading,
    page,
    columns,
    tableCenterTableSize,
    headerGroups,
    isResizingColumn,
    currentCols,
    rows,
    onSortHandler,
    onSelectHandler,
    onPageSizeChangeHandler,
    onPageChangeHandler,
    orderHandler,
    setViewMode,
  } = props;

  let columnBeingDragged: number;
  const router = useRouter();
  const hasPrevious = page > 1;
  const hasNext = to <= count!;
  // Gross temp fix
  useEffect(() => {
    if (!router.query.page_size) {
      router.push({
        query: { ...router.query, page_size: 25 },
      });
    }
  }, [router]);

  return (
    <div className="space-y-2">
      <div className="w-full flex flex-row justify-between items-end">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{from + 1}</span> to{" "}
          <span className="font-medium">{Math.min(to, count)}</span> of{" "}
          {isCountLoading ? (
            <span className="font-medium animate-pulse">...</span>
          ) : (
            <span className="font-medium">{count}</span>
          )}{" "}
          results
        </p>
        {setViewMode && (
          <div className="flex text-sm">
            <ThemedTabs
              options={[
                {
                  label: "Condensed",
                  icon: Square3Stack3DIcon,
                },
                {
                  label: "Expanded",
                  icon: ArrowsPointingOutIcon,
                },
              ]}
              onOptionSelect={(option) =>
                setViewMode(option as "Condensed" | "Expanded")
              }
            />
          </div>
        )}
      </div>

      {columns.filter((c) => c.active).length < 1 ? (
        <div className="w-full h-48 items-center justify-center align-middle flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm p-2">
          <TableCellsIcon className="h-12 w-12 text-gray-500" />
          <p className="italic text-gray-500">No columns selected</p>
        </div>
      ) : (
        <div className="overflow-x-auto font-sans min-w-full">
          <table
            {...{
              style: {
                width: tableCenterTableSize,
                // width: table.getCenterTotalSize(),
              },
            }}
            className="inline-block w-full bg-white border border-gray-200 rounded-lg shadow-sm p-2"
          >
            <thead className="text-left text-sm font-semibold text-gray-900">
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => {
                    const currentCol = columns.find(
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
                          !isResizingColumn
                          //   !table.getState().columnSizingInfo.isResizingColumn
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

                          const colToBeMoved = currentCols.splice(
                            columnBeingDragged,
                            1
                          );

                          currentCols.splice(newPosition, 0, colToBeMoved[0]);
                          orderHandler && orderHandler(currentCols);
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
                        {onSortHandler && (
                          <button
                            onClick={() => {
                              if (currentCol) {
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
                        )}

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
              {rows.map((row, idx) => {
                const original = row.original as any;
                const hasError = original.error;

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
            value={router.query.page_size}
          >
            <option>10</option>
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
}

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import {
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useRouter } from "next/router";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { Result } from "../../../../lib/result";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { SingleFilterDef } from "../../../../services/lib/filters/frontendFilterDefs";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../../services/lib/sorts/requests/sorts";
import { clsx } from "../../clsx";
import LoadingAnimation from "../../loadingAnimation";
import { UIFilterRow } from "../themedAdvancedFilters";
import ThemedTimeFilter from "../themedTimeFilter";
import ThemedTableHeader from "./themedTableHeader";

interface ThemedTableV5Props<T> {
  defaultData: T[];
  defaultColumns: ColumnDef<T>[];
  tableKey: string;
  dataLoading: boolean;
  advancedFilters?: {
    filterMap: SingleFilterDef<any>[];
    filters: UIFilterRow[];
    setAdvancedFilters: Dispatch<SetStateAction<UIFilterRow[]>>;
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
  };
  timeFilter?: {
    defaultValue: "24h" | "7d" | "1m" | "3m" | "all";
    onTimeSelectHandler: (key: TimeInterval, value: string) => void;
  };
  exportData?: any[];
  sortable?: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  onRowSelect?: (row: T) => void;
  chart?: React.ReactNode;
  expandedRow?: (row: T) => React.ReactNode;
}

export default function ThemedTableV5<T>(props: ThemedTableV5Props<T>) {
  const {
    defaultData,
    defaultColumns,
    tableKey,
    dataLoading,
    advancedFilters,
    exportData,
    timeFilter,
    sortable,
    onRowSelect,
    expandedRow,
    chart,
  } = props;

  const router = useRouter();

  const [visibleColumns, setVisibleColumns] = useState<VisibilityState>({});

  const onVisibilityHandler: OnChangeFn<VisibilityState> = (newState) => {
    setVisibleColumns(newState);
  };

  // this needs to be abstracted out to the parent component to become modular
  useEffect(() => {
    const requestsVisibility = window.localStorage.getItem(tableKey) || null;
    setVisibleColumns(requestsVisibility ? JSON.parse(requestsVisibility) : {});
  }, [tableKey]);

  // syncs the visibility state with local storage
  useEffect(() => {
    localStorage.setItem(tableKey, JSON.stringify(visibleColumns));
  }, [visibleColumns, tableKey]);

  const table = useReactTable({
    data: defaultData,
    columns: defaultColumns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: visibleColumns,
    },
    onColumnVisibilityChange: onVisibilityHandler,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col space-y-4">
      <ThemedTableHeader
        advancedFilters={
          advancedFilters
            ? {
                filterMap: advancedFilters.filterMap,
                filters: advancedFilters.filters,
                searchPropertyFilters: advancedFilters.searchPropertyFilters,
                setAdvancedFilters: advancedFilters.setAdvancedFilters,
              }
            : undefined
        }
        columnsFilter={{
          columns: table.getAllColumns(),
          onSelectAll: table.toggleAllColumnsVisible,
          visibleColumns: table.getVisibleLeafColumns().length,
        }}
        timeFilter={
          timeFilter
            ? {
                defaultValue: timeFilter.defaultValue,
                onTimeSelectHandler: timeFilter.onTimeSelectHandler,
              }
            : undefined
        }
        rows={exportData || []}
      />
      {chart}
      {dataLoading ? (
        <LoadingAnimation title="Loading Data..." />
      ) : rows.length === 0 ? (
        <div className="bg-white h-48 w-full rounded-lg border border-gray-300 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
          <TableCellsIcon className="h-12 w-12 text-gray-400" />
          <p className="text-xl font-semibold text-gray-500">No Data Found</p>
        </div>
      ) : table.getVisibleFlatColumns().length === 0 ? (
        <div className="bg-white h-48 w-full rounded-lg border border-gray-300 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
          <AdjustmentsHorizontalIcon className="h-12 w-12 text-gray-400" />

          <p className="text-xl font-semibold text-gray-500">
            No Columns Selected
          </p>
        </div>
      ) : router.query.expanded && expandedRow ? (
        <div className="overflow-x-auto text-sm bg-white rounded-lg border border-gray-300 py-2 px-4">
          {rows.map((row, i) => (
            <div key={"expanded-row" + i}>{expandedRow(row.original)}</div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-300 py-2 px-4">
          <div className="overflow-x-auto text-sm">
            <table
              {...{
                style: {
                  width: table.getCenterTotalSize(),
                },
              }}
            >
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-gray-300 overflow-hidden"
                  >
                    {headerGroup.headers.map((header, i) => {
                      const meta = header.column.columnDef?.meta as any;
                      const hasSortKey = meta?.sortKey !== undefined;
                      return (
                        <th
                          key={i}
                          {...{
                            colSpan: header.colSpan,
                            style: {
                              width: header.getSize(),
                            },
                          }}
                          className="text-left py-2 font-semibold text-gray-900"
                        >
                          <div className="flex flex-row items-center gap-1.5">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {sortable && hasSortKey && (
                              <span
                                onClick={() => {
                                  if (meta && sortable) {
                                    const {
                                      sortKey,
                                      isCustomProperty,
                                      sortDirection,
                                    } = sortable;

                                    if (sortKey === meta.sortKey) {
                                      const direction =
                                        sortDirection === "asc"
                                          ? "desc"
                                          : "asc";
                                      router.query.sortDirection = direction;
                                    } else {
                                      router.query.sortDirection = "asc";
                                    }

                                    if (meta.isCustomProperty) {
                                      router.query.isCustomProperty = "true";
                                    }
                                    router.query.sortKey = meta.sortKey;
                                    router.push(router);
                                  }
                                }}
                                className="flex-none rounded bg-gray-100 text-gray-900 group-hover:bg-gray-200 hover:cursor-pointer"
                              >
                                {meta.sortKey === sortable.sortKey ? (
                                  sortable.sortDirection === "asc" ? (
                                    <ChevronUpIcon
                                      className="h-4 w-4 border border-yellow-500 rounded-md"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <ChevronDownIcon
                                      className="h-4 w-4 border border-yellow-500 rounded-md"
                                      aria-hidden="true"
                                    />
                                  )
                                ) : (
                                  <ChevronDownIcon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                            )}
                          </div>

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
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-100 hover:cursor-pointer"
                    onClick={onRowSelect && (() => onRowSelect(row.original))}
                  >
                    {row.getVisibleCells().map((cell, i) => (
                      <td
                        key={i}
                        className="py-4 border-t border-gray-300 pr-4 text-gray-700"
                        {...{
                          style: {
                            maxWidth: cell.column.getSize(),
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          },
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

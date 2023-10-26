import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import {
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  ColumnDef,
  ColumnOrderState,
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
import DraggableColumnHeader from "./draggableColumnHeader";
import { TimeFilter } from "../../../templates/dashboard/dashboardPage";

interface ThemedTableV5Props<T> {
  defaultData: T[];
  defaultColumns: ColumnDef<T>[];
  tableKey: string;
  dataLoading: boolean;
  advancedFilters?: {
    filterMap: SingleFilterDef<any>[];
    filters: UIFilterRow[];
    setAdvancedFilters: (filters: UIFilterRow[]) => void;
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
  };
  timeFilter?: {
    currentTimeFilter: TimeFilter;
    defaultValue: "24h" | "7d" | "1m" | "3m" | "all";
    onTimeSelectHandler: (key: TimeInterval, value: string) => void;
  };
  exportData?: any[];
  sortable?: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  onRowSelect?: (row: T, index: number) => void;
  expandedRow?: (row: T) => React.ReactNode;
  hideView?: boolean;
  noDataCTA?: React.ReactNode;
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
    hideView, // hides the view columns button
    noDataCTA,
  } = props;

  const router = useRouter();

  const [visibleColumns, setVisibleColumns] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    defaultColumns.map((column) => column.id as string) // must start out with populated columnOrder so we can splice
  );
  const [view, setView] = useState<"table" | "card">("table");

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
      columnOrder: columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
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
        columnsFilter={
          hideView
            ? undefined
            : {
                columns: table.getAllColumns(),
                onSelectAll: table.toggleAllColumnsVisible,
                visibleColumns: table.getVisibleLeafColumns().length,
              }
        }
        timeFilter={
          timeFilter
            ? {
                defaultValue: timeFilter.defaultValue,
                onTimeSelectHandler: timeFilter.onTimeSelectHandler,
                currentTimeFilter: timeFilter.currentTimeFilter,
              }
            : undefined
        }
        viewToggle={
          expandedRow
            ? {
                onViewChange: setView,
              }
            : undefined
        }
        rows={exportData || []}
      />

      {dataLoading ? (
        <LoadingAnimation title="Loading Data..." />
      ) : rows.length === 0 ? (
        <div className="bg-white h-48 w-full rounded-lg border border-gray-300 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
          <TableCellsIcon className="h-12 w-12 text-gray-400" />
          <p className="text-xl font-semibold text-gray-500">No Data Found</p>
          {noDataCTA}
        </div>
      ) : table.getVisibleFlatColumns().length === 0 ? (
        <div className="bg-white h-48 w-full rounded-lg border border-gray-300 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
          <AdjustmentsHorizontalIcon className="h-12 w-12 text-gray-400" />
          <p className="text-xl font-semibold text-gray-500">
            No Columns Selected
          </p>
        </div>
      ) : expandedRow && view === "card" ? (
        <ul className="flex flex-col space-y-8 divide-y divide-gray-300 bg-white rounded-lg border border-gray-300">
          {rows.map((row, i) => (
            <li key={"expanded-row" + i}>{expandedRow(row.original)}</li>
          ))}
        </ul>
      ) : (
        <div className="bg-white rounded-lg border border-gray-300 py-2 px-4">
          <div
            className="text-sm"
            style={{
              boxSizing: "border-box",
              overflowX: "auto",
              overflowY: "visible",
            }}
          >
            <table
              {...{
                style: {
                  width: table.getCenterTotalSize(),
                },
              }}
            >
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-gray-300">
                    {headerGroup.headers.map((header) => (
                      <DraggableColumnHeader
                        key={header.id}
                        header={header}
                        table={table}
                        sortable={sortable}
                      />
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-100 hover:cursor-pointer"
                    onClick={
                      onRowSelect && (() => onRowSelect(row.original, index))
                    }
                  >
                    {row.getVisibleCells().map((cell, i) => (
                      <td
                        key={i}
                        className={clsx(
                          "py-4 border-t border-gray-300 pr-4 text-gray-700"
                        )}
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

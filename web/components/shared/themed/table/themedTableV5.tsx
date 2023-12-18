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
import React, { useEffect, useState } from "react";
import { Result } from "../../../../lib/result";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { SingleFilterDef } from "../../../../services/lib/filters/frontendFilterDefs";
import { SortDirection } from "../../../../services/lib/sorts/requests/sorts";
import { clsx } from "../../clsx";
import LoadingAnimation from "../../loadingAnimation";
import { UIFilterRow } from "../themedAdvancedFilters";
import ThemedTableHeader from "./themedTableHeader";
import DraggableColumnHeader from "./draggableColumnHeader";
import { TimeFilter } from "../../../templates/dashboard/dashboardPage";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import RequestRowView from "./requestRowView";
import { NormalizedRequest } from "../../../templates/requestsV2/builder/abstractRequestBuilder";
import { Menu } from "@headlessui/react";
import FilterBadge from "../../../ui/filters/filterBadge";

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
  makeCard?: (row: T) => React.ReactNode;
  makeRow?: {
    properties: string[];
  };
  hideView?: boolean;
  noDataCTA?: React.ReactNode;
}

export type RequestViews = "table" | "card" | "row";

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
    makeCard,
    makeRow,
    hideView, // hides the view columns button
    noDataCTA,
  } = props;

  const [visibleColumns, setVisibleColumns] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    defaultColumns.map((column) => column.id as string) // must start out with populated columnOrder so we can splice
  );
  const [view, setView] = useLocalStorage<RequestViews>("view", "table");

  const onVisibilityHandler: OnChangeFn<VisibilityState> = (newState) => {
    setVisibleColumns(newState);
  };

  // this needs to be abstracted out to the parent component to become modular
  useEffect(() => {
    const requestsVisibility = window.localStorage.getItem(tableKey) || null;
    if (requestsVisibility) {
      setVisibleColumns(JSON.parse(requestsVisibility));
    }
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
          makeCard
            ? {
                currentView: view,
                onViewChange: setView,
              }
            : undefined
        }
        rows={exportData || []}
      />
      <div className="flex flex-row space-x-2 items-center w-full">
        <FilterBadge title="Created At">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-row">
              {[
                { key: "24h", value: "24H" },
                { key: "7d", value: "7D" },
                { key: "1m", value: "1M" },
                { key: "3m", value: "3M" },
                { key: "all", value: "All" },
              ].map((option, idx) => (
                <button
                  key={option.key}
                  type="button"
                  // disabled={isFetching}
                  onClick={() => {
                    // searchParams.set("t", option.key);
                    // setActive(option.key);
                    // onSelect(option.key, option.value);
                  }}
                  className={clsx(
                    idx === 0 ? "rounded-l-lg" : "",
                    idx === 4 ? "rounded-r-lg" : "",
                    "w-full flex border border-gray-300 dark:border-gray-700 justify-center p-2 text-xs font-semibold"
                  )}
                >
                  {option.value}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Start Date
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    name="startDate"
                    id="startDate"
                    onChange={(e) => {
                      // setStartDate(e.target.value);
                    }}
                    // value={startDate}
                    className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  End Date
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    name="endDate"
                    id="endDate"
                    onChange={(e) => {
                      // setEndDate(e.target.value);
                    }}
                    // value={endDate}
                    className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="py-1 w-full flex flex-row gap-3 items-center justify-end">
              <button
                onClick={() => close()}
                className="items-center rounded-md bg-white dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm flex font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // if (!startDate || !endDate) {
                  //   setNotification(
                  //     "Please select a start and end date",
                  //     "error"
                  //   );
                  //   return;
                  // }
                  // if (endDate && startDate > endDate) {
                  //   setNotification(
                  //     "Start date must be before end date",
                  //     "error"
                  //   );
                  //   return;
                  // }
                  // if (startDate && startDate < startDate) {
                  //   setNotification(
                  //     "End date must be after start date",
                  //     "error"
                  //   );
                  //   return;
                  // }
                  // const start = new Date(startDate as string);
                  // const end = new Date(endDate as string);
                  // searchParams.set(
                  //   "t",
                  //   `custom_${start.toISOString()}_${end.toISOString()}`
                  // );
                  // setActive("custom");
                  // onSelect(
                  //   "custom",
                  //   `${start.toISOString()}_${end.toISOString()}`
                  // );
                  // close();
                }}
                className="items-center rounded-md bg-black dark:bg-white px-3 py-1.5 text-sm flex font-semibold text-white dark:text-black dark:hover:bg-gray-200 shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Save
              </button>
            </div>
          </div>
        </FilterBadge>
        <FilterBadge title={"Model"}>
          <fieldset className="w-full">
            <button className="w-full flex font-semibold text-gray-500 justify-center items-center bg-gray-200 dark:bg-gray-800 rounded-lg text-xs py-1 border border-gray-300 dark:border-gray-700">
              Clear All
            </button>
            <div className="divide-y divide-gray-200 dark:divide-gray-800 w-full mt-1">
              {[
                { id: 1, name: "gpt-4-0613" },
                { id: 2, name: "gpt-3.5-turbo" },
                { id: 3, name: "claude-2.0" },
                { id: 4, name: "mistral-7b" },
              ].map((person, personIdx) => (
                <div
                  key={personIdx}
                  className="relative flex items-start py-2 w-full"
                >
                  <div className="min-w-0 flex-1 text-sm leading-6 truncate w-24 overflow-hidden">
                    <label
                      htmlFor={`person-${person.id}`}
                      className="select-none font-semibold"
                    >
                      {person.name}
                    </label>
                  </div>
                  <div className="ml-3 flex h-6 items-center">
                    <input
                      id={`person-${person.id}`}
                      name={`person-${person.id}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-sky-500 focus:ring-sky-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </FilterBadge>
        <FilterBadge title={"Status"}>
          <fieldset className="w-full">
            <div className="divide-y divide-gray-200 dark:divide-gray-800 w-full">
              {[
                { id: 1, name: "Success (200)" },
                { id: 2, name: "400" },
                { id: 3, name: "404" },
                { id: 4, name: "500" },
              ].map((person, personIdx) => (
                <div
                  key={personIdx}
                  className="relative flex items-start py-2 w-full"
                >
                  <div className="min-w-0 flex-1 text-sm leading-6 truncate w-24 overflow-hidden">
                    <label
                      htmlFor={`person-${person.id}`}
                      className="select-none font-semibold"
                    >
                      {person.name}
                    </label>
                  </div>
                  <div className="ml-3 flex h-6 items-center">
                    <input
                      id={`person-${person.id}`}
                      name={`person-${person.id}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-sky-500 focus:ring-sky-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </FilterBadge>
      </div>
      {dataLoading ? (
        <LoadingAnimation title="Loading Data..." />
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-black h-48 w-full rounded-lg border border-gray-300 dark:border-gray-700 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
          <TableCellsIcon className="h-12 w-12 text-gray-900 dark:text-gray-100" />
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            No Data Found
          </p>
          {noDataCTA}
        </div>
      ) : table.getVisibleFlatColumns().length === 0 ? (
        <div className="bg-white dark:bg-black h-48 w-full rounded-lg border border-gray-300 dark:border-gray-700 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
          <AdjustmentsHorizontalIcon className="h-12 w-12 text-gray-900 dark:text-gray-100" />
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            No Columns Selected
          </p>
        </div>
      ) : makeCard && view === "card" ? (
        <ul className="flex flex-col space-y-8 divide-y divide-gray-300 dark:divide-gray-700 bg-white dark:bg-black rounded-lg border border-gray-300 dark:border-gray-700">
          {rows.map((row, i) => (
            <li key={"expanded-row" + i}>{makeCard(row.original)}</li>
          ))}
        </ul>
      ) : makeRow && view === "row" ? (
        <RequestRowView
          rows={rows.map((row) => row.original as NormalizedRequest)}
          properties={makeRow.properties}
        />
      ) : (
        <div className="bg-white dark:bg-black rounded-lg border border-gray-300 dark:border-gray-700 py-2 px-4">
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
                  <tr
                    key={headerGroup.id}
                    className="border-b border-gray-300 dark:border-gray-700"
                  >
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
                    className="hover:bg-gray-100 dark:hover:bg-gray-900 hover:cursor-pointer"
                    onClick={
                      onRowSelect && (() => onRowSelect(row.original, index))
                    }
                  >
                    {row.getVisibleCells().map((cell, i) => (
                      <td
                        key={i}
                        className={clsx(
                          "py-4 border-t border-gray-300 dark:border-gray-700 pr-4 text-gray-700 dark:text-gray-300"
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

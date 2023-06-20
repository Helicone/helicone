import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { TableCellsIcon } from "@heroicons/react/24/outline";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { Result } from "../../../lib/result";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { clsx } from "../../shared/clsx";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import ThemedTableHeader from "./themedTableHeader";

interface ThemedTableV5Props<T> {
  defaultData: T[];
  defaultColumns: ColumnDef<T>[];
  dataLoading?: boolean;

  // TODO: change this to a more generic type???
  header?: {
    currentRange: DateRange | undefined;
    onTimeFilter: (range: DateRange | undefined) => void;
    flattenedExportData: any[];

    // TODO: rewrite these filters
    filterMap: SingleFilterDef<any>[];
    filters: UIFilterRow[];
    setAdvancedFilters: Dispatch<SetStateAction<UIFilterRow[]>>;
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
  };
  sortable?: {
    currentSortLeaf: SortLeafRequest;
  };
  onRowSelect?: (row: T) => void;
  onColumnSort?: (column: ColumnDef<T>) => void;
}

export default function ThemedTableV5<T>(props: ThemedTableV5Props<T>) {
  const {
    defaultData,
    defaultColumns,
    dataLoading,
    header,
    sortable,
    onRowSelect,
  } = props;

  const router = useRouter();

  const [visibleColumns, setVisibleColumns] = useState<VisibilityState>({});

  const onVisibilityHandler: OnChangeFn<VisibilityState> = (newState) => {
    setVisibleColumns(newState);
  };

  useEffect(() => {
    const requestsVisibility =
      window.localStorage.getItem("requestsColumnVisibility") || null;
    setVisibleColumns(requestsVisibility ? JSON.parse(requestsVisibility) : {});
  }, []);

  // syncs the visibility state with local storage
  useEffect(() => {
    localStorage.setItem(
      "requestsColumnVisibility",
      JSON.stringify(visibleColumns)
    );
  }, [visibleColumns]);

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
      {header && (
        <ThemedTableHeader
          currentRange={header.currentRange}
          columns={table.getAllColumns()}
          onSelectAll={table.toggleAllColumnsVisible}
          visibleColumns={table.getVisibleLeafColumns().length}
          rows={header.flattenedExportData}
          onTimeFilter={header.onTimeFilter}
          filterMap={header.filterMap}
          filters={header.filters}
          searchPropertyFilters={header.searchPropertyFilters}
          setAdvancedFilters={header.setAdvancedFilters}
        />
      )}
      {dataLoading ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
        <div className="bg-white h-48 w-full rounded-lg border border-gray-300 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
          <TableCellsIcon className="h-12 w-12 text-gray-400" />
          <p className="text-xl font-semibold text-gray-500">
            No Requests Found
          </p>
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
                                  if (meta) {
                                    const entry = Object.entries(
                                      sortable.currentSortLeaf
                                    ).at(0);
                                    if (entry) {
                                      const key = entry[0];
                                      const value = entry[1];
                                      if (key === meta.sortKey) {
                                        router.query.sort = JSON.stringify({
                                          [meta.sortKey]:
                                            value === "asc" ? "desc" : "asc",
                                        });
                                        router.push(router);
                                        return;
                                      } else {
                                        router.query.sort = JSON.stringify({
                                          [meta.sortKey]: "asc",
                                        });
                                        router.push(router);
                                      }
                                    }
                                  }
                                }}
                                className="flex-none rounded bg-gray-100 text-gray-900 group-hover:bg-gray-200 hover:cursor-pointer"
                              >
                                {/* render the chevron up icon if this column is ascending */}
                                {meta.sortKey ===
                                Object.keys(sortable.currentSortLeaf)[0] ? (
                                  Object.values(sortable.currentSortLeaf)[0] ===
                                  "asc" ? (
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

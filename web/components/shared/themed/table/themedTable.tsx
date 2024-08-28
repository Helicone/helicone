import {
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect } from "react";
import { Result } from "../../../../lib/result";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { SingleFilterDef } from "../../../../services/lib/filters/frontendFilterDefs";
import { UIFilterRowTree } from "../../../../services/lib/filters/uiFilterRowTree";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../../services/lib/sorts/requests/sorts";
import { TimeFilter } from "../../../templates/dashboard/dashboardPage";
import { NormalizedRequest } from "../../../templates/requestsV2/builder/abstractRequestBuilder";
import { clsx } from "../../clsx";
import LoadingAnimation from "../../loadingAnimation";
import {
  columnDefsToDragColumnItems,
  columnDefToDragColumnItem,
  DragColumnItem,
} from "./columns/DragList";
import DraggableColumnHeader from "./columns/draggableColumnHeader";
import RequestRowView from "./requestRowView";
import ThemedTableHeader from "./themedTableHeader";

import { Checkbox } from "@mui/material";

interface ThemedTableV5Props<T extends { id?: string }> {
  id: string;
  defaultData: T[];
  defaultColumns: ColumnDef<T>[];
  skeletonLoading: boolean;
  dataLoading: boolean;
  advancedFilters?: {
    filterMap: SingleFilterDef<any>[];
    filters: UIFilterRowTree;
    setAdvancedFilters: (filters: UIFilterRowTree) => void;
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
    show?: boolean;
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
  onRowSelect?: (rowId: string, checked: boolean) => void;
  makeCard?: (row: T) => React.ReactNode;
  makeRow?: {
    properties: string[];
  };
  hideView?: boolean;
  noDataCTA?: React.ReactNode;
  onDataSet?: () => void;
  savedFilters?: {
    filters?: OrganizationFilter[];
    currentFilter?: string;
    onFilterChange?: (value: OrganizationFilter | null) => void;
    onSaveFilterCallback?: () => void;
    layoutPage: "dashboard" | "requests";
  };
  highlightedIds?: string[];
  showCheckboxes?: boolean;
  customButtons?: React.ReactNode[];
  children?: React.ReactNode;
  onSelectAll?: (checked: boolean) => void;
  selectedIds?: string[];
}

export type RequestViews = "table" | "card" | "row";

export default function ThemedTable<T extends { id?: string }>(
  props: ThemedTableV5Props<T>
) {
  const {
    id,
    defaultData,
    defaultColumns,
    skeletonLoading,
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
    onDataSet: onDataSet,
    savedFilters,
    highlightedIds: checkedIds,
    showCheckboxes,

    customButtons,
    children,
    onSelectAll,
    selectedIds,
  } = props;

  const [view, setView] = useLocalStorage<RequestViews>("view", "table");

  const [activeColumns, setActiveColumns] = useLocalStorage<DragColumnItem[]>(
    `${id}-activeColumns`,
    defaultColumns?.map(columnDefToDragColumnItem)
  );

  const table = useReactTable({
    data: defaultData,
    columns: defaultColumns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder: activeColumns.map((column) => column.id),
    },
  });

  const rows = table.getRowModel().rows;
  const columns = table.getAllColumns();

  useEffect(() => {
    // This is a weird hack for people migrating to a new local storage
    if (activeColumns.length > 0 && activeColumns.every((c) => c.id === "")) {
      setActiveColumns(columnDefsToDragColumnItems(columns));
    }
  }, [activeColumns, columns, setActiveColumns]);

  useEffect(() => {
    for (const column of columns) {
      if (activeColumns.find((c) => c.name === column.id)?.shown) {
        if (!column.getIsVisible()) {
          column.toggleVisibility(true);
        }
      } else {
        if (column.getIsVisible()) {
          column.toggleVisibility(false);
        }
      }
    }
  }, [activeColumns, columns]);

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked);
  };

  const handleRowSelect = (rowId: string) => {
    onRowSelect?.(rowId, !selectedIds?.includes(rowId));
  };

  return (
    <div className="flex flex-col space-y-4">
      <ThemedTableHeader
        onDataSet={onDataSet}
        advancedFilters={
          advancedFilters
            ? {
                filterMap: advancedFilters.filterMap,
                filters: advancedFilters.filters,
                searchPropertyFilters: advancedFilters.searchPropertyFilters,
                setAdvancedFilters: advancedFilters.setAdvancedFilters,
                show: advancedFilters.show,
              }
            : undefined
        }
        savedFilters={savedFilters}
        activeColumns={activeColumns}
        setActiveColumns={setActiveColumns}
        columns={hideView ? [] : table.getAllColumns()}
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
        rows={exportData}
        customButtons={customButtons}
      />
      {children}

      {skeletonLoading ? (
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
          rows={rows.map((row) => row.original as unknown as NormalizedRequest)}
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
                    {showCheckboxes && (
                      <th className="w-8 px-2">
                        <Checkbox
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          checked={selectedIds?.length === rows.length}
                          indeterminate={
                            selectedIds &&
                            selectedIds?.length > 0 &&
                            selectedIds?.length < rows.length
                          }
                        />
                      </th>
                    )}
                    {headerGroup.headers.map((header, index) => (
                      <DraggableColumnHeader
                        key={`header-${index}`}
                        header={header}
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
                    className={clsx(
                      "hover:bg-gray-100 dark:hover:bg-gray-900 hover:cursor-pointer",
                      checkedIds?.includes(row.original?.id ?? "") &&
                        "bg-blue-100 border-l border-blue-500 pl-2"
                    )}
                    onClick={
                      onRowSelect &&
                      (() => handleRowSelect(row.original?.id ?? ""))
                    }
                  >
                    {showCheckboxes && (
                      <td className="w-8 px-2">
                        <Checkbox
                          checked={selectedIds?.includes(
                            row.original?.id ?? ""
                          )}
                          onChange={() => {}} // Handle individual row selection
                        />
                      </td>
                    )}
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
                        {dataLoading &&
                        (cell.column.id == "requestText" ||
                          cell.column.id == "responseText") ? (
                          <span
                            className={clsx(
                              "w-full flex flex-grow",
                              (cell.column.id == "requestText" ||
                                cell.column.id == "responseText") &&
                                dataLoading
                                ? "animate-pulse bg-gray-200 rounded-md"
                                : "hidden"
                            )}
                          >
                            &nbsp;
                          </span>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
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

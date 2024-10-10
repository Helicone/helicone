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
import React, { useEffect, useState } from "react";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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
  onRowSelect?: (row: T, index: number) => void;
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
  fullWidth?: boolean;
  isDatasetsPage?: boolean;
  rightPanel?: React.ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
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
    fullWidth = false,
    isDatasetsPage,
    rightPanel,
    search,
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

  const handleRowSelect = (row: T, index: number) => {
    onRowSelect?.(row, index);
  };

  const [isPanelVisible, setIsPanelVisible] = useState(false);

  useEffect(() => {
    if (rightPanel) {
      // Delay the animation start slightly
      const timer = setTimeout(() => {
        setIsPanelVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsPanelVisible(false);
    }
  }, [rightPanel]);

  return (
    <div className="h-full flex flex-col border-b divide-y divide-slate-300 dark:divide-slate-700">
      <div className="p-1 flex-shrink-0">
        <ThemedTableHeader
          search={search}
          onDataSet={onDataSet}
          isDatasetsPage={isDatasetsPage}
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
      </div>

      {children && <div className="flex-shrink-0">{children}</div>}
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>
          {" "}
          <div className="h-full overflow-x-auto bg-white dark:bg-black">
            {skeletonLoading ? (
              <LoadingAnimation title="Loading Data..." />
            ) : rows.length === 0 ? (
              <div className="bg-white dark:bg-black h-48 w-full  border-slate-300 dark:border-slate-700 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
                <TableCellsIcon className="h-12 w-12 text-slate-900 dark:text-slate-100" />
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  No Data Found
                </p>
                {noDataCTA}
              </div>
            ) : table.getVisibleFlatColumns().length === 0 ? (
              <div className="bg-white dark:bg-black h-48 w-full  border-slate-300 dark:border-slate-700 py-2 px-4 flex flex-col space-y-3 justify-center items-center">
                <AdjustmentsHorizontalIcon className="h-12 w-12 text-slate-900 dark:text-slate-100" />
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  No Columns Selected
                </p>
              </div>
            ) : makeCard && view === "card" ? (
              <ul className="flex flex-col space-y-8 divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-black rounded-lg border border-slate-300 dark:border-slate-700">
                {rows.map((row, i) => (
                  <li key={"expanded-row" + i}>{makeCard(row.original)}</li>
                ))}
              </ul>
            ) : makeRow && view === "row" ? (
              <RequestRowView
                rows={rows.map(
                  (row) => row.original as unknown as NormalizedRequest
                )}
                properties={makeRow.properties}
              />
            ) : (
              <div className="bg-white dark:bg-black rounded-sm h-full">
                <div
                  className=""
                  style={{
                    boxSizing: "border-box",
                  }}
                >
                  <table
                    className="h-full bg-white dark:bg-black"
                    {...{
                      style: {
                        width: fullWidth ? "100%" : table.getCenterTotalSize(),
                        overflow: "auto",
                      },
                    }}
                  >
                    <thead className="text-[12px]">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr
                          key={headerGroup.id}
                          className="sticky top-0  bg-slate-50 dark:bg-slate-900 shadow-sm"
                        >
                          {showCheckboxes && (
                            <th className="w-8 px-2 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900">
                              <Checkbox
                                onChange={(e) =>
                                  handleSelectAll(e.target.checked)
                                }
                                checked={selectedIds?.length === rows.length}
                                indeterminate={
                                  selectedIds &&
                                  selectedIds?.length > 0 &&
                                  selectedIds?.length < rows.length
                                }
                              />
                              <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-300 dark:bg-slate-700" />
                            </th>
                          )}
                          {headerGroup.headers.map((header, index) => (
                            <th
                              key={`header-${index}`}
                              className={clsx("relative")}
                            >
                              <DraggableColumnHeader
                                header={header}
                                sortable={sortable}
                                index={index}
                                totalColumns={headerGroup.headers.length}
                              />
                              {index < headerGroup.headers.length - 1 && (
                                <div className="absolute top-0 right-0 h-full w-px bg-slate-300 dark:bg-slate-700" />
                              )}
                              <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="text-[13px] ">
                      {rows.map((row, index) => (
                        <tr
                          key={row.id}
                          className={clsx(
                            " hover:cursor-pointer",
                            checkedIds?.includes(row.original?.id ?? "")
                              ? "bg-sky-100 border-l border-sky-500 pl-2 dark:bg-sky-900 dark:border-sky-900"
                              : "hover:bg-sky-50 dark:hover:bg-sky-950"
                          )}
                          onClick={
                            onRowSelect &&
                            (() => handleRowSelect(row.original, index))
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
                                "py-3 border-t border-slate-300 dark:border-slate-700 px-2 text-slate-700 dark:text-slate-300",
                                i === 0 && "pl-10", // Add left padding to the first column
                                i === row.getVisibleCells().length - 1 &&
                                  "pr-10"
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
                                      ? "animate-pulse bg-slate-200 rounded-md"
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
        </ResizablePanel>
        {rightPanel && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel minSize={25} maxSize={75}>
              <div className="h-full flex-shrink-0 flex flex-col">
                {rightPanel}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

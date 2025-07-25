import { UIFilterRowTree } from "@helicone-package/filters/types";
import { TimeFilter } from "@/types/timeFilter";
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
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { Result } from "@/packages/common/result";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { SingleFilterDef } from "@helicone-package/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../../services/lib/sorts/requests/sorts";

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

import { Checkbox } from "@/components/ui/checkbox";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { RequestViews } from "./RequestViews";
import useShiftKeyPress from "@/services/hooks/isShiftPressed";

type CheckboxMode = "always_visible" | "on_hover" | "never";

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
      search: string,
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
  onRowSelect?: (row: T, index: number, event?: React.MouseEvent) => void;
  makeCard?: (row: T) => React.ReactNode;
  makeRow?: {
    properties: string[];
  };
  hideView?: boolean;
  hideHeader?: boolean;
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
  /**
   * Controls the visibility of checkboxes in the table
   * - "always_visible": Checkboxes are always shown
   * - "on_hover": Checkboxes are shown on hover and for selected rows
   * - "never": No checkboxes are shown (default)
   */
  checkboxMode?: CheckboxMode;
  customButtons?: React.ReactNode[];
  children?: React.ReactNode;
  onSelectAll?: (checked: boolean) => void;
  selectedIds?: string[];
  selectedRows?: {
    showSelectedCount?: boolean;
    children?: React.ReactNode;
  };
  fullWidth?: boolean;
  isDatasetsPage?: boolean;
  rightPanel?: React.ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  rowLink?: (row: T) => string;
  showFilters?: boolean;
}

export default function ThemedTable<T extends { id?: string }>(
  props: ThemedTableV5Props<T>,
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
    hideHeader,
    noDataCTA,
    onDataSet: onDataSet,
    savedFilters,
    highlightedIds: checkedIds,
    checkboxMode = "never",
    customButtons,
    children,
    onSelectAll,
    selectedIds,
    selectedRows,
    fullWidth = false,
    isDatasetsPage,
    rightPanel,
    search,
    rowLink,
    showFilters,
  } = props;
  const isShiftPressed = useShiftKeyPress();

  const [view, setView] = useLocalStorage<RequestViews>("view", "table");

  const [activeColumns, setActiveColumns] = useLocalStorage<DragColumnItem[]>(
    `${id}-activeColumns`,
    defaultColumns?.map(columnDefToDragColumnItem),
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

  const handleRowSelect = (row: T, index: number, event: React.MouseEvent) => {
    onRowSelect?.(row, index, event);
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

  const sessionData = useMemo(() => {
    if (rows.length === 0) {
      return undefined;
    }
    // @ts-ignore
    const sessionId = rows[0].original?.customProperties?.[
      "Helicone-Session-Id"
    ] as string | undefined;
    return { sessionId };
  }, [rows]);

  return (
    <div className="flex h-full flex-col divide-y divide-slate-300 border-slate-300 dark:divide-slate-700 dark:border-slate-700">
      {!hideHeader && (
        <div className="flex-shrink-0 p-1">
          <ThemedTableHeader
            search={search}
            onDataSet={onDataSet}
            advancedFilters={
              advancedFilters
                ? {
                    filterMap: advancedFilters.filterMap,
                    filters: advancedFilters.filters,
                    searchPropertyFilters:
                      advancedFilters.searchPropertyFilters,
                    setAdvancedFilters: advancedFilters.setAdvancedFilters,
                    show: advancedFilters.show,
                  }
                : undefined
            }
            showFilters={showFilters}
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
            selectedRows={{
              count: selectedIds?.length,
              children: selectedRows?.children,
            }}
          />
        </div>
      )}

      {children && <div className="flex-shrink-0">{children}</div>}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow overflow-hidden"
      >
        <ResizablePanel defaultSize={100} className="flex-grow">
          <div className="h-full overflow-auto">
            {skeletonLoading ? (
              <LoadingAnimation title="Loading Data..." />
            ) : rows.length === 0 ? (
              <div className="flex h-48 w-full flex-col items-center justify-center space-y-3 border-slate-300 bg-white px-4 py-2 dark:border-slate-700 dark:bg-black">
                <TableCellsIcon className="h-12 w-12 text-slate-900 dark:text-slate-100" />
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  No Data Found
                </p>
                {noDataCTA}
              </div>
            ) : table.getVisibleFlatColumns().length === 0 ? (
              <div className="flex h-48 w-full flex-col items-center justify-center space-y-3 border-slate-300 bg-white px-4 py-2 dark:border-slate-700 dark:bg-black">
                <AdjustmentsHorizontalIcon className="h-12 w-12 text-slate-900 dark:text-slate-100" />
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  No Columns Selected
                </p>
              </div>
            ) : makeCard && view === "card" ? (
              <ul className="flex flex-col space-y-8 divide-y divide-slate-300 rounded-lg border border-slate-300 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-black">
                {rows.map((row, i) => (
                  <li key={"expanded-row" + i}>{makeCard(row.original)}</li>
                ))}
              </ul>
            ) : makeRow && view === "row" ? (
              <RequestRowView
                rows={rows.map(
                  (row) => row.original as unknown as MappedLLMRequest,
                )}
                properties={makeRow.properties}
              />
            ) : (
              <div className="h-full rounded-sm bg-slate-50 dark:bg-black">
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
                    <thead className="z-[2] h-11 text-[12px]">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr
                          key={headerGroup.id}
                          className="sticky top-0 bg-slate-50 shadow-sm dark:bg-slate-900"
                        >
                          <th
                            className={clsx(
                              "sticky left-0 z-20 w-8 bg-slate-50 px-2 dark:bg-slate-900",
                              checkboxMode === "never" && "hidden",
                            )}
                          >
                            <div
                              className={clsx(
                                checkboxMode === "on_hover" &&
                                  "opacity-40 transition-opacity duration-150 hover:opacity-100",
                              )}
                            >
                              <Checkbox
                                variant="blue"
                                onCheckedChange={handleSelectAll}
                                checked={selectedIds?.length === rows.length}
                                ref={(ref) => {
                                  if (ref) {
                                    (
                                      ref as unknown as HTMLInputElement
                                    ).indeterminate =
                                      selectedIds !== undefined &&
                                      selectedIds.length > 0 &&
                                      selectedIds.length < rows.length;
                                  }
                                }}
                                className="data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary"
                              />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                          </th>
                          {headerGroup.headers.map((header, index) => (
                            <th
                              key={`header-${index}`}
                              className={clsx(
                                "relative",
                                index === headerGroup.headers.length - 1 &&
                                  "border-r border-slate-300 dark:border-slate-700",
                              )}
                            >
                              <DraggableColumnHeader
                                header={header}
                                sortable={sortable}
                                index={index}
                                totalColumns={headerGroup.headers.length}
                              />
                              {index < headerGroup.headers.length - 1 && (
                                <div className="absolute right-0 top-0 h-full w-px bg-slate-300 dark:bg-slate-700" />
                              )}
                              <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="text-[13px]">
                      {rows.map((row, index) => (
                        <tr
                          key={row.original?.id}
                          data-state={row.getIsSelected() && "selected"}
                          onClick={(e) =>
                            handleRowSelect(row.original, index, e)
                          }
                          className={clsx(
                            isShiftPressed && "select-none",
                            (checkedIds?.includes(row.original?.id ?? "") ||
                              selectedIds?.includes(row.original?.id ?? "")) &&
                              "bg-sky-50 dark:bg-sky-950",
                            checkboxMode === "on_hover"
                              ? "group cursor-pointer"
                              : "cursor-default",
                          )}
                        >
                          <td
                            className={clsx(
                              "w-8 border-t border-slate-300 px-2 dark:border-slate-700",
                              checkboxMode === "on_hover"
                                ? clsx(
                                    "opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                                    selectedIds?.includes(
                                      row.original?.id ?? "",
                                    ) && "!opacity-100",
                                  )
                                : "",
                              checkboxMode === "never" && "hidden",
                            )}
                          >
                            <Checkbox
                              variant="blue"
                              checked={selectedIds?.includes(
                                row.original?.id ?? "",
                              )}
                              onChange={() => {}}
                              className="text-slate-700 dark:text-slate-400"
                            />
                          </td>
                          {row.getVisibleCells().map((cell, i) => (
                            <td
                              key={i}
                              className={clsx(
                                "border-t border-slate-300 px-2 py-3 text-slate-700 dark:border-slate-700 dark:text-slate-300",
                                i === 0 &&
                                  checkboxMode === "always_visible" &&
                                  "pl-2",
                                i === 0 &&
                                  checkboxMode === "on_hover" &&
                                  "pl-2",
                                i === 0 && checkboxMode === "never" && "pl-10",
                                // For selected rows in hover mode
                                i === 0 &&
                                  checkboxMode === "on_hover" &&
                                  selectedIds?.includes(
                                    row.original?.id ?? "",
                                  ) &&
                                  "!pl-2",
                                i === row.getVisibleCells().length - 1 &&
                                  "border-r border-slate-300 pr-10 dark:border-slate-700",
                              )}
                              style={{
                                maxWidth: cell.column.getSize(),
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {dataLoading &&
                              (cell.column.id == "requestText" ||
                                cell.column.id == "responseText") ? (
                                <span
                                  className={clsx(
                                    "flex w-full flex-grow",
                                    (cell.column.id == "requestText" ||
                                      cell.column.id == "responseText") &&
                                      dataLoading
                                      ? "animate-pulse rounded-md bg-slate-200"
                                      : "hidden",
                                  )}
                                >
                                  &nbsp;
                                </span>
                              ) : (
                                flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )
                              )}
                            </td>
                          ))}
                          {rowLink && (
                            <td
                              className="m-0 border-0 p-0"
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                padding: 0,
                                margin: 0,
                                border: "none",
                                background: "transparent",
                                pointerEvents: "none",
                                zIndex: 2,
                              }}
                            >
                              <Link
                                href={rowLink(row.original)}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  height: "100%",
                                  opacity: 0,
                                  pointerEvents: "auto",
                                }}
                                onClick={(e: React.MouseEvent) => {
                                  if (onRowSelect) {
                                    e.stopPropagation();
                                  }
                                }}
                                aria-hidden="true"
                              />
                            </td>
                          )}
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
            <>
              <ResizableHandle withHandle />
              <ResizablePanel minSize={25} maxSize={75} defaultSize={75}>
                <div className="flex h-full flex-shrink-0 flex-col">
                  {rightPanel}
                </div>
              </ResizablePanel>
            </>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UIFilterRowTree } from "@helicone-package/filters/types";
import { TimeFilter } from "@/types/timeFilter";
import {
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  Table as ReactTable,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { Result } from "@/packages/common/result";
import { SingleFilterDef } from "@helicone-package/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../../services/lib/sorts/requests/sorts";
import { clsx } from "../../clsx";
import LoadingAnimation from "../../loadingAnimation";
import { DragColumnItem } from "./columns/DragList";
import DraggableColumnHeader from "./columns/draggableColumnHeader";

type CheckboxMode = "always_visible" | "on_hover" | "never";

function ConditionalLink({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href?: string | undefined;
  className?: string;
}) {
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    children
  );
}

interface ThemedTableProps<T extends { id?: string; subRows?: T[] }> {
  id: string;
  defaultData: T[];
  defaultColumns: ColumnDef<T>[];
  skeletonLoading: boolean;
  dataLoading: boolean;
  tableRef?: React.MutableRefObject<any>;
  activeColumns: DragColumnItem[];
  setActiveColumns: (columns: DragColumnItem[]) => void;
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
  hideHeader?: boolean;
  noDataCTA?: React.ReactNode;
  onDataSet?: () => void;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
  savedFilters?: {
    filters?: OrganizationFilter[];
    currentFilter?: string;
    onFilterChange?: (value: OrganizationFilter | null) => void;
    onSaveFilterCallback?: () => void;
    layoutPage: "dashboard" | "requests";
  };
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
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  rowLink?: (row: T) => string;
  showFilters?: boolean;
  /**
   * Callback function to trigger toggling the expansion state of all rows.
   * Receives the table instance.
   */
  onToggleAllRows?: (table: ReactTable<T>) => void;
  currentRow?: T;
}

export default function ThemedTable<T extends { id?: string; subRows?: T[] }>(
  props: ThemedTableProps<T>,
) {
  const {
    id,
    defaultData,
    defaultColumns,
    skeletonLoading,
    dataLoading,
    activeColumns,
    sortable,
    onRowSelect,
    noDataCTA,
    showClearFilters = false,
    onClearFilters,
    checkboxMode = "never",
    children,
    onSelectAll,
    selectedIds,
    fullWidth = false,
    rowLink,
    tableRef,
    onToggleAllRows,
    currentRow,
  } = props;

  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Initialize column sizes from minSize or default
  const initialColumnSizes = useMemo(() => {
    return defaultColumns.reduce(
      (acc, col, idx) => {
        const columnDef = col as any;
        acc[idx] = columnDef.minSize ?? columnDef.size ?? 120;
        return acc;
      },
      {} as Record<number, number>,
    );
  }, [defaultColumns]);

  const [columnSizes, setColumnSizes] = useLocalStorage<Record<number, number>>(
    `${id}-column-sizes`,
    initialColumnSizes,
  );

  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Measure actual text width using Canvas API
  const measureTextWidth = useCallback((text: string, font: string): number => {
    if (typeof document === "undefined") return 0;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return 0;

    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }, []);

  // Calculate minimum width based on actual header text width and default width
  const getMinColumnWidth = useCallback(
    (column: ColumnDef<any>, defaultWidth: number) => {
      const header = typeof column.header === "string" ? column.header : "";
      // Measure actual text width with the header font (12px semibold)
      const headerTextWidth = measureTextWidth(
        header,
        "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      );
      const padding = 24; // Account for padding and potential sort icons
      const textBasedMin = Math.max(headerTextWidth + padding, 60); // Minimum 60px

      // Return the smaller of text-based minimum or default width
      // This prevents jumping when user starts to resize
      return Math.min(textBasedMin, defaultWidth);
    },
    [measureTextWidth],
  );

  // Column resize handlers
  const handleResizeStart = useCallback(
    (columnIndex: number, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setResizingColumn(columnIndex);
      resizeStartX.current = event.clientX;
      resizeStartWidth.current = columnSizes[columnIndex] ?? 120;
    },
    [columnSizes],
  );

  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      if (resizingColumn === null) return;

      const deltaX = event.clientX - resizeStartX.current;
      const currentColumn = defaultColumns[resizingColumn];
      const columnDef = currentColumn as any;
      const defaultWidth =
        columnSizes[resizingColumn] ?? columnDef.minSize ?? columnDef.size ?? 120;
      const minWidth = getMinColumnWidth(currentColumn, defaultWidth);
      const newWidth = Math.max(minWidth, resizeStartWidth.current + deltaX);

      setColumnSizes({
        ...columnSizes,
        [resizingColumn]: newWidth,
      });
    },
    [resizingColumn, columnSizes, setColumnSizes, getMinColumnWidth, defaultColumns],
  );

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (resizingColumn !== null) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  // Update column sizes when columns change
  useEffect(() => {
    const newSizes: Record<number, number> = {};
    let shouldUpdate = false;

    defaultColumns.forEach((col, idx) => {
      const columnDef = col as any;
      if (columnSizes[idx] === undefined) {
        newSizes[idx] = columnDef.minSize ?? columnDef.size ?? 120;
        shouldUpdate = true;
      } else {
        newSizes[idx] = columnSizes[idx];
      }
    });

    if (shouldUpdate) {
      setColumnSizes(newSizes);
    }
  }, [defaultColumns]);

  const table = useReactTable({
    data: defaultData,
    columns: defaultColumns,
    columnResizeMode: "onChange",
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      columnOrder: activeColumns.map((column) => column.id),
      expanded,
    },
    onExpandedChange: setExpanded,
  });

  if (tableRef) {
    tableRef.current = table;
  }

  const rows = table.getRowModel().rows;
  const columns = table.getAllColumns();

  const topLevelPathColorMap = useMemo(() => {
    const chartColors = [
      "bg-chart-1",
      "bg-chart-2",
      "bg-chart-3",
      "bg-chart-4",
      "bg-chart-5",
    ];
    const map: Record<string, string> = {};
    let colorIndex = 0;

    rows.forEach((row) => {
      if (row.depth === 0) {
        const path = (row.original as any)?.path as string;
        if (path && !(path in map)) {
          map[path] = chartColors[colorIndex % chartColors.length];
          colorIndex++;
        }
      }
    });
    return map;
  }, [rows]);

  useEffect(() => {
    const columnVisibility: { [key: string]: boolean } = {};
    activeColumns.forEach((col) => {
      columnVisibility[col.id] = col.shown;
    });
    columns.forEach((column) => {
      if (columnVisibility[column.id] === undefined) {
        columnVisibility[column.id] = true;
      }
    });
    table.setColumnVisibility(columnVisibility);
  }, [activeColumns, columns, table]);

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked);
  };

  const handleRowSelect = (row: T, index: number, event: React.MouseEvent) => {
    onRowSelect?.(row, index, event);
  };

  return (
    <ScrollArea
      className="sentry-mask-me h-full w-full"
      orientation="both"
      width="thin"
    >
      {children && <div className="flex-shrink-0">{children}</div>}
      <div className="h-full bg-slate-50 dark:bg-slate-950">
        {skeletonLoading ? (
          <LoadingAnimation title="Loading Data..." />
        ) : rows.length === 0 ? (
          <div className="flex h-48 w-full flex-col items-center justify-center space-y-3 border-border bg-white px-4 py-2 dark:bg-black">
            <TableCellsIcon className="h-12 w-12 text-slate-900 dark:text-slate-100" />
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              No Data Found
            </p>
            {showClearFilters && onClearFilters && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="text-slate-900 dark:text-slate-100"
              >
                Clear Filters
              </Button>
            )}
            {noDataCTA}
          </div>
        ) : table.getVisibleFlatColumns().length === 0 ? (
          <div className="flex h-48 w-full flex-col items-center justify-center space-y-3 border-border bg-white px-4 py-2 dark:bg-black">
            <AdjustmentsHorizontalIcon className="h-12 w-12 text-slate-900 dark:text-slate-100" />
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              No Columns Selected
            </p>
          </div>
        ) : (
          <table
            className="bg-white dark:bg-black"
            style={{
              width: fullWidth ? "100%" : table.getCenterTotalSize(),
            }}
          >
            <thead className="text-[12px]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="sticky top-0 z-[2] h-11 bg-slate-50 dark:bg-slate-950"
                >
                  {checkboxMode !== "never" && (
                    <th className="relative" style={{ height: "44px", width: "48px", minWidth: "48px", maxWidth: "48px" }}>
                      <div className="flex h-full items-center justify-center px-2">
                        <Checkbox
                          variant="helicone"
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
                  )}
                  {headerGroup.headers.map((header, index) => {
                    const columnDef = defaultColumns[index] as any;
                    const columnWidth = columnSizes[index] ?? columnDef.minSize ?? columnDef.size ?? 120;

                    return (
                      <th
                        key={`header-${index}`}
                        className={clsx(
                          "relative",
                          index === headerGroup.headers.length - 1 &&
                            "border-r border-slate-300 dark:border-slate-700",
                        )}
                        style={{
                          width: `${columnWidth}px`,
                          minWidth: `${columnWidth}px`,
                          maxWidth: `${columnWidth}px`,
                          height: "44px",
                        }}
                      >
                        {index === 0 && onToggleAllRows !== undefined && (
                          <div className="absolute left-1 top-1/2 z-10 -translate-y-1/2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onToggleAllRows(table)}
                              className="h-6 w-6"
                              aria-label={"Toggle expand all rows"}
                            >
                              <ChevronsUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <DraggableColumnHeader
                          header={header}
                          sortable={sortable}
                          index={index}
                          totalColumns={headerGroup.headers.length}
                          onResizeStart={handleResizeStart}
                          isResizing={resizingColumn === index}
                        />
                        {index < headerGroup.headers.length - 1 && (
                          <div className="absolute right-0 top-0 h-full w-px bg-slate-300 dark:bg-slate-700" />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border text-[13px]">
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={clsx(
                    "group relative",
                    rowLink && "relative",
                    selectedIds?.includes(row.id ?? "") ||
                      (currentRow && currentRow.id === row.original.id)
                      ? "!bg-sky-100 dark:!bg-slate-800/50"
                      : clsx(
                          "hover:bg-sky-50 dark:hover:bg-slate-700/50",
                          row.getCanExpand()
                            ? "cursor-pointer bg-muted font-semibold"
                            : row.depth > 0
                              ? "bg-slate-50 dark:bg-slate-950/50"
                              : "bg-white dark:bg-black",
                        ),
                  )}
                  onClick={(e: React.MouseEvent) => {
                    if (row.getCanExpand()) {
                      if (
                        e.target instanceof HTMLElement &&
                        e.target.closest('a, button, input[type="checkbox"]')
                      ) {
                        return;
                      }
                      row.getToggleExpandedHandler()();
                    } else if (onRowSelect) {
                      handleRowSelect(row.original, index, e);
                    }
                  }}
                >
                  <td
                    className={clsx(
                      "sticky bottom-[-2px] left-0 z-[1] h-[1px]",
                      checkboxMode === "on_hover"
                        ? clsx(
                            "m-0 !border-0 px-0 pb-0 pt-[1px] opacity-0 !outline-none group-hover:opacity-100",
                            selectedIds?.includes(row.id ?? "") &&
                              "!opacity-100",
                          )
                        : "",
                      checkboxMode === "never" && "hidden",
                    )}
                    style={{ verticalAlign: "middle", width: "48px", minWidth: "48px", maxWidth: "48px" }}
                  >
                    <div
                      className={clsx(
                        "flex h-full w-full items-center justify-center px-2",
                        selectedIds?.includes(row.id ?? "") ||
                          (currentRow && currentRow.id === row.original.id)
                          ? "bg-inherit"
                          : row.getCanExpand()
                            ? "bg-inherit"
                            : row.depth > 0
                              ? "bg-slate-50 dark:bg-slate-950/50"
                              : "bg-white dark:bg-black",
                      )}
                    >
                      <Checkbox
                        variant="helicone"
                        checked={selectedIds?.includes(row.id ?? "")}
                      />
                    </div>
                  </td>
                  {row.getVisibleCells().map((cell, i) => {
                    const columnDef = defaultColumns[i] as any;
                    const columnWidth = columnSizes[i] ?? columnDef.minSize ?? columnDef.size ?? 120;

                    return (
                      <td
                        key={cell.id}
                        className={clsx(
                          "select-none text-slate-700 dark:text-slate-300",
                          !rowLink?.(row.original) &&
                            clsx(
                              "py-3",
                              i === 0 && "pr-2",
                              i > 0 && "px-2",
                              onRowSelect && "cursor-pointer",
                            ),
                          i === 0 && "relative",
                          selectedIds?.includes(row.id ?? "") ||
                            (currentRow && currentRow.id === row.original.id)
                            ? "bg-inherit"
                            : row.getCanExpand()
                              ? "bg-inherit"
                              : row.depth > 0
                                ? "bg-slate-50 dark:bg-slate-950/50"
                                : "bg-white dark:bg-black",
                          i === row.getVisibleCells().length - 1 &&
                            "border-r border-border",
                        )}
                        style={{
                          width: `${columnWidth}px`,
                          minWidth: `${columnWidth}px`,
                          maxWidth: `${columnWidth}px`,
                        }}
                      >
                      <ConditionalLink
                        href={rowLink?.(row.original)}
                        className={clsx(
                          "block h-full w-full",
                          "py-3",
                          i === 0 && "pr-2",
                          i > 0 && "px-2",
                        )}
                      >
                        <div
                          className={clsx("flex items-center gap-1")}
                          style={
                            i === 0
                              ? {
                                  paddingLeft: `${
                                    row.depth * 24 +
                                    (onToggleAllRows !== undefined ? 24 : 0) +
                                    (row.getCanExpand() ? 0 : 8)
                                  }px`,
                                }
                              : {}
                          }
                        >
                          {i === 0 &&
                            (() => {
                              const getAncestorPath = (
                                currentRow: Row<T>,
                              ): string | undefined => {
                                if (currentRow.depth === 0) {
                                  return (currentRow.original as any)
                                    ?.path as string;
                                }
                                let currentParent = currentRow.getParentRow();
                                while (
                                  currentParent &&
                                  currentParent.depth > 0
                                ) {
                                  currentParent = currentParent.getParentRow();
                                }
                                return currentParent
                                  ? ((currentParent.original as any)
                                      ?.path as string)
                                  : undefined;
                              };

                              const ancestorPath = getAncestorPath(row);
                              const groupColorClass =
                                (ancestorPath &&
                                  topLevelPathColorMap[ancestorPath]) ||
                                "bg-transparent";

                              if (groupColorClass !== "bg-transparent") {
                                return (
                                  <div
                                    className={clsx(
                                      "absolute bottom-0 left-0 top-0 z-30 w-1",
                                      groupColorClass,
                                    )}
                                  />
                                );
                              }
                              return null;
                            })()}

                          {i === 0 && row.getCanExpand() && (
                            <button
                              {...{
                                onClick: row.getToggleExpandedHandler(),
                                style: { cursor: "pointer" },
                                "data-expander": true,
                              }}
                              className="p-0.5"
                            >
                              {row.getIsExpanded() ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          )}
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
                            <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          )}
                        </div>
                      </ConditionalLink>
                    </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ScrollArea>
  );
}

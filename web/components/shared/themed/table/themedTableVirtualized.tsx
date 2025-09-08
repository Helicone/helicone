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
import React, { useEffect, useMemo, useRef, useCallback, memo } from "react";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { Result } from "@/packages/common/result";
import { SingleFilterDef } from "@helicone-package/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../../services/lib/sorts/requests/sorts";
import { clsx } from "../../clsx";
import LoadingAnimation from "../../loadingAnimation";
import { DragColumnItem } from "./columns/DragList";
import DraggableColumnHeader from "./columns/draggableColumnHeader";
import { useVirtualizer } from "@tanstack/react-virtual";

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

interface ThemedTableVirtualizedProps<T extends { id?: string; subRows?: T[] }> {
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
  onToggleAllRows?: (table: ReactTable<T>) => void;
  currentRow?: T;
}

// Memoized row component for better performance
const VirtualizedRow = memo(function VirtualizedRow<T extends { id?: string; subRows?: T[] }>({
  row,
  index,
  rowLink,
  selectedIds,
  currentRow,
  onRowSelect,
  checkboxMode,
  dataLoading,
  topLevelPathColorMap,
  onToggleAllRows,
}: {
  row: Row<T>;
  index: number;
  rowLink?: (row: T) => string;
  selectedIds?: string[];
  currentRow?: T;
  onRowSelect?: (row: T, index: number, event?: React.MouseEvent) => void;
  checkboxMode: CheckboxMode;
  dataLoading: boolean;
  topLevelPathColorMap: Record<string, string>;
  onToggleAllRows?: (table: ReactTable<T>) => void;
}) {
  const handleRowSelect = useCallback((e: React.MouseEvent) => {
    if (row.getCanExpand()) {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('a, button, input[type="checkbox"]')
      ) {
        return;
      }
      row.getToggleExpandedHandler()();
    } else if (onRowSelect) {
      onRowSelect(row.original, index, e);
    }
  }, [row, index, onRowSelect]);

  const isSelected = selectedIds?.includes(row.id ?? "") ||
    (currentRow && currentRow.id === row.original.id);

  return (
    <tr
      className={clsx(
        "group relative",
        rowLink && "relative",
        isSelected
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
      onClick={handleRowSelect}
    >
      <td
        className={clsx(
          "sticky bottom-[-2px] left-0 z-[1] h-[1px]",
          checkboxMode === "on_hover"
            ? clsx(
                "m-0 !border-0 px-0 pb-0 pt-[1px] opacity-0 !outline-none group-hover:opacity-100",
                selectedIds?.includes(row.id ?? "") && "!opacity-100",
              )
            : "",
          checkboxMode === "never" && "hidden",
        )}
        style={{ verticalAlign: "middle" }}
      >
        <div
          className={clsx(
            "flex h-full w-full items-center justify-center",
            isSelected
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
      {row.getVisibleCells().map((cell, i) => (
        <td
          key={cell.id}
          className={clsx(
            "select-none truncate text-slate-700 dark:text-slate-300",
            !rowLink?.(row.original) &&
              clsx(
                "py-3",
                i === 0 && "pr-2",
                i > 0 && "px-2",
                onRowSelect && "cursor-pointer",
              ),
            i === 0 && "relative",
            isSelected
              ? "bg-inherit"
              : row.getCanExpand()
                ? "bg-inherit"
                : row.depth > 0
                  ? "bg-slate-50 dark:bg-slate-950/50"
                  : "bg-white dark:bg-black",
            i === row.getVisibleCells().length - 1 && "border-r border-border",
          )}
          style={{
            maxWidth: cell.column.getSize(),
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
                      return (currentRow.original as any)?.path as string;
                    }
                    let currentParent = currentRow.getParentRow();
                    while (currentParent && currentParent.depth > 0) {
                      currentParent = currentParent.getParentRow();
                    }
                    return currentParent
                      ? ((currentParent.original as any)?.path as string)
                      : undefined;
                  };

                  const ancestorPath = getAncestorPath(row);
                  const groupColorClass =
                    (ancestorPath && topLevelPathColorMap[ancestorPath]) ||
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
                flexRender(cell.column.columnDef.cell, cell.getContext())
              )}
            </div>
          </ConditionalLink>
        </td>
      ))}
    </tr>
  );
});

export default function ThemedTableVirtualized<T extends { id?: string; subRows?: T[] }>(
  props: ThemedTableVirtualizedProps<T>,
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

  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const parentRef = useRef<HTMLDivElement>(null);
  
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

  // Virtual row height estimation
  const estimateSize = useCallback(() => 52, []); // Average row height in pixels

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Render 5 extra rows above and below viewport
  });

  const virtualRows = virtualizer.getVirtualItems();

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

  return (
    <ScrollArea className="sentry-mask-me h-full w-full" orientation="both">
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
          <div
            ref={parentRef}
            className="h-full overflow-auto bg-white dark:bg-black"
          >
            <table
              className="bg-white dark:bg-black"
              style={{
                width: fullWidth ? "100%" : table.getCenterTotalSize(),
              }}
            >
              <thead className="text-[12px] sticky top-0 z-[2]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="h-11 bg-slate-50 dark:bg-slate-950"
                  >
                    {checkboxMode !== "never" && (
                      <th className="relative">
                        <div className="ml-2 flex h-full items-center justify-center">
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
                    {headerGroup.headers.map((header, index) => (
                      <th
                        key={`header-${index}`}
                        className={clsx(
                          "relative",
                          index === headerGroup.headers.length - 1 &&
                            "border-r border-slate-300 dark:border-slate-700",
                        )}
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
              <tbody
                className="divide-y divide-border text-[13px]"
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          tableLayout: "fixed",
                        }}
                      >
                        <tbody>
                          <VirtualizedRow
                            row={row}
                            index={virtualRow.index}
                            rowLink={rowLink}
                            selectedIds={selectedIds}
                            currentRow={currentRow}
                            onRowSelect={onRowSelect}
                            checkboxMode={checkboxMode}
                            dataLoading={dataLoading}
                            topLevelPathColorMap={topLevelPathColorMap}
                            onToggleAllRows={onToggleAllRows}
                          />
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
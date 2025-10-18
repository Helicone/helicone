import { clsx } from "@/components/shared/clsx";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import DraggableColumnHeader from "@/components/shared/themed/table/columns/draggableColumnHeader";
import { DragColumnItem } from "@/components/shared/themed/table/columns/DragList";
import { TableTreeNode } from "@/components/templates/sessions/sessionId/Tree/TreeView";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HeliconeRequestType } from "@/lib/sessions/sessionTypes";
import { UIFilterRowTree } from "@helicone-package/filters/types";
import { useColorMapStore } from "@/store/features/sessions/colorMap";
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
import React, { useEffect, useMemo } from "react";
import { TimeInterval } from "../../../../../lib/timeCalculations/time";
import { Result } from "@/packages/common/result";
import { SingleFilterDef } from "@helicone-package/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../../../services/lib/sorts/requests/sorts";

type CheckboxMode = "always_visible" | "on_hover" | "never";

interface ThemedTableProps<TableTreeNode> {
  id: string;
  defaultData: TableTreeNode[];
  defaultColumns: ColumnDef<TableTreeNode>[];
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
  onRowSelect?: (
    row: TableTreeNode,
    index: number,
    event?: React.MouseEvent,
  ) => void;
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
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  rowLink?: (row: TableTreeNode) => string;
  showFilters?: boolean;
  /**
   * Callback function to trigger toggling the expansion state of all rows.
   * Receives the table instance.
   */
  onToggleAllRows?: (table: ReactTable<TableTreeNode>) => void;
}

export default function SessionTimelineTable(
  props: ThemedTableProps<TableTreeNode>,
) {
  const {
    defaultData,
    defaultColumns,
    skeletonLoading,
    dataLoading,
    activeColumns,
    sortable,
    onRowSelect,
    noDataCTA,
    highlightedIds: checkedIds,
    checkboxMode = "never",
    children,
    onSelectAll,
    selectedIds,
    fullWidth = false,
    rowLink,
    tableRef,
    onToggleAllRows,
  } = props;

  const [expanded, setExpanded] = React.useState<ExpandedState>(true);
  const descendantErrorMap = useMemo(() => {
    return defaultData.reduce((mapAccumulator, topLevelNode) => {
      setDescendantError(topLevelNode, mapAccumulator);
      return mapAccumulator;
    }, new Map<string, boolean>());
  }, [defaultData]);

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
  const rowsById = Object.values(table.getRowModel().rowsById);

  useEffect(() => {
    rowsById.forEach((row) => {
      if (checkedIds?.includes(row.original?.id ?? "")) {
        expandRow(row);
      }
    });
  }, [checkedIds]);

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

  const handleRowSelect = (
    row: TableTreeNode,
    index: number,
    event: React.MouseEvent,
  ) => {
    onRowSelect?.(row, index, event);
  };

  const { getColor } = useColorMapStore();

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
                    <th>
                      <div className="flex h-full items-center justify-center">
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
            <tbody className="divide-y divide-border text-[13px]">
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={clsx(
                    "group relative",
                    rowLink && "relative",
                    // Determine background color based on selection state
                    (() => {
                      if (
                        checkedIds?.includes(row.original?.id ?? "") ||
                        selectedIds?.includes(row.original?.id ?? "")
                      ) {
                        return "!bg-sky-100 dark:!bg-slate-800/50";
                      }

                      const hoverClass =
                        "hover:bg-sky-50 dark:hover:bg-slate-700/50";

                      if (row.getCanExpand()) {
                        return `${hoverClass} cursor-pointer bg-muted font-semibold`;
                      } else if (row.depth > 0) {
                        return `${hoverClass} bg-slate-50 dark:bg-slate-950/50`;
                      } else {
                        return `${hoverClass} bg-white dark:bg-black`;
                      }
                    })(),
                  )}
                  onClick={(e) => {
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
                      "sticky left-0 z-10 h-full",
                      row.getCanExpand()
                        ? "bg-inherit"
                        : row.depth > 0
                          ? "bg-slate-50 dark:bg-slate-950/50"
                          : "bg-white dark:bg-black",
                      checkboxMode === "on_hover"
                        ? clsx(
                            "opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                            selectedIds?.includes(row.original?.id ?? "") &&
                              "!opacity-100",
                          )
                        : "",
                      checkboxMode === "never" && "hidden",
                    )}
                    style={{ verticalAlign: "middle" }}
                  >
                    <div className="flex h-full items-center justify-center">
                      <Checkbox
                        variant="helicone"
                        checked={selectedIds?.includes(row.original?.id ?? "")}
                      />
                    </div>
                  </td>
                  {row.getVisibleCells().map((cell, i) => (
                    <td
                      key={cell.id}
                      className={clsx(
                        "select-none truncate pl-1 text-slate-700 dark:text-slate-300",
                        cell.column.id === "path" ? "relative pr-2" : "py-1",
                        (() => {
                          if (
                            checkedIds?.includes(row.original?.id ?? "") ||
                            selectedIds?.includes(row.original?.id ?? "") ||
                            row.getCanExpand()
                          ) {
                            return "bg-inherit";
                          } else if (row.depth > 0) {
                            return "bg-slate-50 dark:bg-slate-950/50";
                          } else {
                            return "bg-white dark:bg-black";
                          }
                        })(),
                        i === row.getVisibleCells().length - 1 &&
                          "border-r border-border",
                      )}
                      style={{
                        maxWidth: cell.column.getSize(),
                      }}
                    >
                      <div
                        className="my-1 flex items-center gap-1"
                        style={
                          i === 0
                            ? {
                                paddingLeft: `${
                                  row.depth * 24 +
                                  (onToggleAllRows !== undefined ? 24 : 0) +
                                  (row.getCanExpand() ? 0 : 8)
                                }px`,
                              }
                            : undefined
                        }
                      >
                        {cell.column.id === "path" &&
                          (() => {
                            // Group color indicator
                            const groupColorClass =
                              getColor(row.original.completePath) ||
                              "transparent";
                            const colorBar =
                              groupColorClass !== "bg-transparent" ? (
                                <div
                                  className={`z-9 absolute bottom-0 left-0 top-0 w-1 bg-${groupColorClass}`}
                                />
                              ) : null;

                            // Expansion chevron for expandable rows
                            const expansionChevron = row.getCanExpand() && (
                              <>
                                {row.getIsExpanded() ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </>
                            );

                            // Request type badge for leaf nodes
                            const requestTypeBadge = !row.getCanExpand() && (
                              <span
                                className={clsx(
                                  "my-1 mr-4 flex-shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium",
                                  REQUEST_TYPE_CONFIG[
                                    row.original.heliconeRequestType!
                                  ].bgColor,
                                )}
                              >
                                {
                                  REQUEST_TYPE_CONFIG[
                                    row.original!.heliconeRequestType!
                                  ].displayName
                                }
                              </span>
                            );

                            return (
                              <>
                                {colorBar}
                                {expansionChevron}
                                {requestTypeBadge}
                              </>
                            );
                          })()}
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
                          <div className="pl-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        )}
                        {cell.column.id === "path" &&
                          descendantErrorMap.get(row.original.id) && (
                            <span
                              title="Contains descendant error"
                              className="ml-2 h-2 w-2 shrink-0 rounded-full bg-red-600"
                            />
                          )}
                      </div>
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
                          e.stopPropagation();
                        }}
                        aria-hidden="true"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ScrollArea>
  );
}

const REQUEST_TYPE_CONFIG: Record<
  HeliconeRequestType,
  { bgColor: string; displayName: string }
> = {
  LLM: {
    bgColor: "bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-200",
    displayName: "LLM",
  },
  Tool: {
    bgColor:
      "bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-200",
    displayName: "Tool",
  },
  VectorDB: {
    bgColor:
      "bg-orange-200 dark:bg-orange-900 text-orange-700 dark:text-orange-200",
    displayName: "Vector DB",
  },
  Data: {
    bgColor:
      "bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-200",
    displayName: "Data",
  },
};

function setDescendantError<T extends TableTreeNode>(
  node: T,
  map: Map<string, boolean>,
): boolean {
  let hasError = false;
  for (const child of node.subRows ?? []) {
    if (child.status && child.status >= 400 && child.status < 500) {
      map.set(child.id, true);
      hasError = true;
    }

    if (setDescendantError(child, map)) {
      hasError = true;
    }
  }

  map.set(node.id, hasError);
  return hasError;
}

function expandRow(row: Row<any>) {
  if (row.getCanExpand()) {
    row.toggleExpanded(true);
  }

  const parentRow = row.getParentRow();
  if (parentRow) {
    expandRow(parentRow);
  }
}

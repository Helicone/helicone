import { TableTreeNode } from "@/components/templates/sessions/sessionId/Tree/TreeView";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UIFilterRowTree } from "@/services/lib/filters/types";
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
import { Result } from "../../../../../packages/common/result";
import { SingleFilterDef } from "../../../../../services/lib/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../../../services/lib/sorts/requests/sorts";
import { DragColumnItem } from "@/components/shared/themed/table/columns/DragList";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import DraggableColumnHeader from "@/components/shared/themed/table/columns/draggableColumnHeader";
import { clsx } from "@/components/shared/clsx";
import { useColorMapStore } from "@/store/features/sessions/colorMap";

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
  onRowSelect?: (
    row: TableTreeNode,
    index: number,
    event?: React.MouseEvent
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
  props: ThemedTableProps<TableTreeNode>
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
    const map = new Map<string, boolean>();
    defaultData.forEach((topLevelNode) => {
      // Assuming TableTreeNode has an 'id' property
      if (topLevelNode.id) {
        map.set(topLevelNode.id, hasDescendant4xxError(topLevelNode, true));
      }
    });
    return map;
  }, [defaultData]); // Recalculate only when data changes

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
  }, [checkedIds, rowsById]);

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
    event: React.MouseEvent
  ) => {
    onRowSelect?.(row, index, event);
  };

  const { getColor } = useColorMapStore();

  return (
    <ScrollArea className="h-full w-full sentry-mask-me" orientation="both">
      {children && <div className="flex-shrink-0">{children}</div>}
      <div className="h-full bg-slate-50 dark:bg-slate-950">
        {skeletonLoading ? (
          <LoadingAnimation title="Loading Data..." />
        ) : rows.length === 0 ? (
          <div className="bg-white dark:bg-black h-48 w-full  border-border py-2 px-4 flex flex-col space-y-3 justify-center items-center">
            <TableCellsIcon className="h-12 w-12 text-slate-900 dark:text-slate-100" />
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              No Data Found
            </p>
            {noDataCTA}
          </div>
        ) : table.getVisibleFlatColumns().length === 0 ? (
          <div className="bg-white dark:bg-black h-48 w-full  border-border py-2 px-4 flex flex-col space-y-3 justify-center items-center">
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
                  className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-[2] h-11"
                >
                  {checkboxMode !== "never" && (
                    <th>
                      <div className="flex justify-center items-center h-full">
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
                          "border-r border-slate-300 dark:border-slate-700"
                      )}
                    >
                      {index === 0 && onToggleAllRows !== undefined && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10">
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
                        <div className="absolute top-0 right-0 h-full w-px bg-slate-300 dark:bg-slate-700" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="text-[13px] divide-y divide-border">
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
                        return `${hoverClass} font-semibold cursor-pointer bg-muted`;
                      } else if (row.depth > 0) {
                        return `${hoverClass} bg-slate-50 dark:bg-slate-950/50`;
                      } else {
                        return `${hoverClass} bg-white dark:bg-black`;
                      }
                    })()
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
                      "h-full sticky left-0 z-10",
                      row.getCanExpand()
                        ? "bg-inherit"
                        : row.depth > 0
                        ? "bg-slate-50 dark:bg-slate-950/50"
                        : "bg-white dark:bg-black",
                      checkboxMode === "on_hover"
                        ? clsx(
                            "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                            selectedIds?.includes(row.original?.id ?? "") &&
                              "!opacity-100"
                          )
                        : "",
                      checkboxMode === "never" && "hidden"
                    )}
                    style={{ verticalAlign: "middle" }}
                  >
                    <div className="flex justify-center items-center h-full">
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
                        "text-slate-700 dark:text-slate-300 truncate select-none",
                        i === 0 ? "pr-2 relative" : "py-1",
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
                          "border-r border-border"
                      )}
                      style={{
                        maxWidth: cell.column.getSize(),
                      }}
                    >
                      <div
                        className="flex items-center gap-1"
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
                        {i === 0 &&
                          (() => {
                            const groupColorClass =
                              getColor(row.original.currentPath) ||
                              "bg-transparent";

                            if (groupColorClass !== "bg-transparent") {
                              return (
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-1 z-9"
                                  style={{ backgroundColor: groupColorClass }}
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
                        {i === 0 && !row.getCanExpand() && (
                          <span className="inline-block mr-1 px-2 py-1 bg-sky-200 text-blue-800 rounded text-xs whitespace-nowrap">
                            {row.original?.name}
                          </span>
                        )}
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
                        {i === 0 &&
                          row.getParentRow() === undefined &&
                          descendantErrorMap.get(row.original.id ?? "") ===
                            true && (
                            <span
                              title="Contains descendant 4xx error"
                              className="w-2 h-2 ml-2 rounded-full bg-red-600 shrink-0"
                            />
                          )}
                      </div>
                    </td>
                  ))}
                  {rowLink && (
                    <td
                      className="p-0 m-0 border-0"
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

// Helper function to check for descendant 4xx errors
// Assumes T extends TableTreeNode and has subRows & status
function hasDescendant4xxError<T extends TableTreeNode>(
  node: T,
  isTopLevel: boolean
): boolean {
  // Use type assertion if subRows isn't directly on TableTreeNode but expected

  if (!node.subRows || node.subRows.length === 0) {
    // Base case: Check self only if not top-level
    if (!isTopLevel) {
      return false;
    }
  }

  for (const child of node.subRows ?? []) {
    const childStatus = child.status;
    if (childStatus && childStatus >= 400) return true;

    if (hasDescendant4xxError(child, false)) {
      return true;
    }
  }

  return false;
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

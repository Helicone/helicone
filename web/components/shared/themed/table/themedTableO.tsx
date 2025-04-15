import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";
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
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { Result } from "../../../../packages/common/result";
import { SingleFilterDef } from "../../../../services/lib/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../../services/lib/sorts/requests/sorts";
import { clsx } from "../../clsx";
import LoadingAnimation from "../../loadingAnimation";
import { DragColumnItem } from "./columns/DragList";
import DraggableColumnHeader from "./columns/draggableColumnHeader";

type CheckboxMode = "always_visible" | "on_hover" | "never";

interface ThemedTableProps<T extends { id?: string }> {
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
  onRowSelect?: (row: T, index: number, event?: React.MouseEvent) => void;
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
  rowLink?: (row: T) => string;
  showFilters?: boolean;
}
export default function ThemedTable<T extends { id?: string }>(
  props: ThemedTableProps<T>
) {
  const {
    id,
    defaultData,
    defaultColumns,
    skeletonLoading,
    dataLoading,
    activeColumns,
    setActiveColumns,
    advancedFilters,
    exportData,
    timeFilter,
    sortable,
    onRowSelect,
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
    search,
    rowLink,
    tableRef,
  } = props;

  const table = useReactTable({
    data: defaultData,
    columns: defaultColumns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder: activeColumns.map((column) => column.id),
    },
  });

  if (tableRef) {
    tableRef.current = table;
  }

  const rows = table.getRowModel().rows;
  const columns = table.getAllColumns();

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

  const [isPanelVisible, setIsPanelVisible] = useState(false);

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

  const { currentStep, isOnboardingVisible, setOnClickElement } =
    useOnboardingContext();

  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (
      id === "requests-table" &&
      isOnboardingVisible &&
      currentStep === ONBOARDING_STEPS.REQUESTS_DRAWER.stepNumber
    ) {
      setOnClickElement(
        () => () =>
          router.push(
            `/sessions/${encodeURIComponent(sessionData?.sessionId || "")}`
          )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboardingVisible, currentStep]);

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
                  className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-[2]"
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
                  key={row.original?.id}
                  className={clsx(
                    "hover:cursor-pointer group",
                    checkedIds?.includes(row.original?.id ?? "")
                      ? "bg-sky-100 border-l border-sky-500 pl-2 dark:bg-slate-800/50 dark:border-sky-900"
                      : "hover:bg-sky-50 dark:hover:bg-slate-700/50",
                    rowLink && "relative"
                  )}
                  onClick={
                    onRowSelect &&
                    ((e: React.MouseEvent) => {
                      handleRowSelect(row.original, index, e);
                    })
                  }
                >
                  <td
                    className={clsx(
                      "w-8 h-full px-2",
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
                      key={i}
                      className={clsx(
                        "py-3 px-2 text-slate-700 dark:text-slate-300",
                        i === 0 && checkboxMode === "always_visible" && "pl-2",
                        i === 0 && checkboxMode === "on_hover" && "pl-2",
                        i === 0 && checkboxMode === "never" && "pl-10",
                        // For selected rows in hover mode
                        i === 0 &&
                          checkboxMode === "on_hover" &&
                          selectedIds?.includes(row.original?.id ?? "") &&
                          "!pl-2",
                        i === row.getVisibleCells().length - 1 &&
                          "pr-10 border-r border-border"
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
        )}
      </div>
    </ScrollArea>
  );
}

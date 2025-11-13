import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clsx } from "../clsx";
import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useLocalStorage } from "@/services/hooks/localStorage";

export type ColumnConfig<T> = {
  key: keyof T | undefined;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  minSize?: number;
};

interface SimpleTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  emptyMessage?: string;
  onSelect?: (item: T) => void;
  className?: string;
  defaultSortKey?: keyof T;
  defaultSortDirection?: "asc" | "desc";
  onSort?: (key: keyof T | undefined, direction: "asc" | "desc") => void;
  currentSortKey?: keyof T | string;
  currentSortDirection?: "asc" | "desc";
  tableId?: string; // For persisting column sizes
}

export function SimpleTable<T>(props: SimpleTableProps<T>) {
  const {
    data,
    columns,
    emptyMessage = "No data available",
    onSelect,
    defaultSortKey,
    defaultSortDirection = "desc",
    onSort,
    currentSortKey,
    currentSortDirection,
    tableId,
  } = props;

  const [internalSortConfig, setInternalSortConfig] = useState<{
    key: keyof T | undefined;
    direction: "asc" | "desc";
  }>({
    key: defaultSortKey,
    direction: defaultSortDirection,
  });

  // Initialize column sizes from minSize or default
  const initialColumnSizes = columns.reduce(
    (acc, col, idx) => {
      acc[idx] = col.minSize ?? 120;
      return acc;
    },
    {} as Record<number, number>,
  );

  const [columnSizes, setColumnSizes] = useLocalStorage<Record<number, number>>(
    tableId ? `${tableId}-column-sizes` : "table-column-sizes",
    initialColumnSizes,
  );

  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const sortConfig = onSort
    ? {
        key: currentSortKey as keyof T | undefined,
        direction: currentSortDirection || "desc",
      }
    : internalSortConfig;

  const sortedData = onSort
    ? data
    : [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        const compareResult = aValue < bValue ? -1 : 1;
        return sortConfig.direction === "asc" ? compareResult : -compareResult;
      });

  const handleSort = (key: keyof T | undefined) => {
    if (!key || key === undefined) return;

    const newDirection =
      sortConfig.key === key && sortConfig.direction === "desc"
        ? "asc"
        : "desc";

    if (onSort) {
      onSort(key, newDirection);
    } else {
      setInternalSortConfig({
        key,
        direction: newDirection,
      });
    }
  };

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
    (column: ColumnConfig<T>, defaultWidth: number) => {
      // Measure actual text width with the header font (12px semibold)
      const headerTextWidth = measureTextWidth(
        column.header,
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
      const currentColumn = columns[resizingColumn];
      const defaultWidth =
        columnSizes[resizingColumn] ?? currentColumn.minSize ?? 120;
      const minWidth = getMinColumnWidth(currentColumn, defaultWidth);
      const newWidth = Math.max(minWidth, resizeStartWidth.current + deltaX);

      setColumnSizes({
        ...columnSizes,
        [resizingColumn]: newWidth,
      });
    },
    [resizingColumn, columnSizes, setColumnSizes, getMinColumnWidth, columns],
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

    columns.forEach((col, idx) => {
      if (columnSizes[idx] === undefined) {
        newSizes[idx] = col.minSize ?? 120;
        shouldUpdate = true;
      } else {
        newSizes[idx] = columnSizes[idx];
      }
    });

    if (shouldUpdate) {
      setColumnSizes(newSizes);
    }
  }, [columns]);

  return (
    <ScrollArea className="h-full w-full" orientation="both">
      <div className="h-full bg-slate-50 dark:bg-slate-950">
        {sortedData.length === 0 ? (
          <div className="flex h-48 w-full items-center justify-center border-border bg-white px-4 py-2 dark:bg-black">
            <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
          </div>
        ) : (
          <Table className="min-w-full bg-white dark:bg-black">
            <TableHeader>
              <TableRow className="sticky top-0 z-[2] h-11 bg-slate-50 dark:bg-slate-950">
                {columns.map((column, index) => (
                  <TableHead
                    key={String(column.key || index)}
                    className={clsx(
                      "relative text-[12px] font-semibold text-slate-900 dark:text-slate-100",
                      index === 0 && "pl-10",
                      column.sortable &&
                        "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                      index === columns.length - 1 &&
                        "border-r border-slate-300 dark:border-slate-700",
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                    style={{
                      width: `${columnSizes[index] ?? column.minSize ?? 120}px`,
                      minWidth: `${columnSizes[index] ?? column.minSize ?? 120}px`,
                      maxWidth: `${columnSizes[index] ?? column.minSize ?? 120}px`,
                    }}
                  >
                    <div className="flex h-full items-center gap-2">
                      {column.sortable &&
                        sortConfig.key === column.key &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        ))}
                      {column.header}
                    </div>
                    {index < columns.length - 1 && (
                      <div className="absolute right-0 top-0 h-full w-px bg-slate-300 dark:bg-slate-700" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                    {/* Resize handle */}
                    <div
                      className={clsx(
                        "absolute right-0 top-0 h-full w-4 cursor-col-resize select-none",
                        "flex items-center justify-center",
                        "hover:bg-slate-200 dark:hover:bg-slate-700",
                      )}
                      onMouseDown={(e) => handleResizeStart(index, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div
                        className={clsx(
                          "h-full w-1",
                          resizingColumn === index
                            ? "bg-blue-700 dark:bg-blue-300"
                            : "bg-transparent",
                        )}
                      />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border text-[13px]">
              {sortedData.map((item, index) => (
                <TableRow
                  key={`row-${index}`}
                  className={clsx(
                    "hover:bg-sky-50 dark:hover:bg-slate-700/50",
                    onSelect && "hover:cursor-pointer",
                    "bg-white dark:bg-black",
                  )}
                  onClick={() => onSelect && onSelect(item)}
                >
                  {columns.map((column, subIndex) => (
                    <TableCell
                      key={String(column.key || subIndex + column.header)}
                      className={clsx(
                        "select-none px-2 py-3 text-slate-700 dark:text-slate-300",
                        subIndex === 0 && "pl-10 pr-2",
                        subIndex > 0 && "px-2",
                        subIndex === columns.length - 1 &&
                          "border-r border-border",
                      )}
                      style={{
                        width: `${columnSizes[subIndex] ?? column.minSize ?? 120}px`,
                        minWidth: `${columnSizes[subIndex] ?? column.minSize ?? 120}px`,
                        maxWidth: `${columnSizes[subIndex] ?? column.minSize ?? 120}px`,
                      }}
                    >
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {column.render(item)}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </ScrollArea>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/services/hooks/localStorage";

// Constants for column sizing
const COLUMN_PADDING = 24; // Padding and space for sort icons
const MIN_COLUMN_WIDTH = 60; // Minimum column width in pixels
const DEFAULT_COLUMN_WIDTH = 120; // Default column width when not specified
const HEADER_FONT = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

interface ColumnWithSize {
  minSize?: number;
  size?: number;
  header?: any; // Allow any type for header to support both simple strings and complex components
}

interface UseColumnResizeOptions<T extends ColumnWithSize> {
  columns: T[];
  tableId: string;
}

interface UseColumnResizeReturn {
  columnSizes: Record<number, number>;
  resizingColumn: number | null;
  handleResizeStart: (columnIndex: number, event: React.MouseEvent) => void;
}

export function useColumnResize<T extends ColumnWithSize>({
  columns,
  tableId,
}: UseColumnResizeOptions<T>): UseColumnResizeReturn {
  // Canvas ref for efficient text measurement
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextConfigured = useRef<boolean>(false);

  // Initialize column sizes from minSize or default
  const initialColumnSizes = useMemo(() => {
    return columns.reduce(
      (acc, col, idx) => {
        acc[idx] = col.minSize ?? col.size ?? DEFAULT_COLUMN_WIDTH;
        return acc;
      },
      {} as Record<number, number>,
    );
  }, [columns]);

  const [columnSizes, setColumnSizes] = useLocalStorage<Record<number, number>>(
    `${tableId}-column-sizes`,
    initialColumnSizes,
  );

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
      }
      contextConfigured.current = false;
    };
  }, []);

  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Measure actual text width using Canvas API with error handling
  const measureTextWidth = useCallback((text: string): number => {
    if (typeof document === "undefined") return 0;

    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
        contextConfigured.current = false;
      }

      const context = canvasRef.current.getContext("2d");
      if (!context) return 0;

      if (!contextConfigured.current) {
        context.font = HEADER_FONT;
        contextConfigured.current = true;
      }

      const metrics = context.measureText(text);
      return metrics.width;
    } catch (error) {
      console.error("Failed to measure text width:", error);
      return 0;
    }
  }, []);

  // Calculate minimum width based on actual header text width and default width
  const getMinColumnWidth = useCallback(
    (column: T, defaultWidth: number) => {
      const header = typeof column.header === "string" ? column.header : "";
      if (!header) return MIN_COLUMN_WIDTH;

      // Measure actual text width with the header font
      const headerTextWidth = measureTextWidth(header);
      const textBasedMin = Math.max(
        headerTextWidth + COLUMN_PADDING,
        MIN_COLUMN_WIDTH,
      );

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
      resizeStartWidth.current = columnSizes[columnIndex] ?? DEFAULT_COLUMN_WIDTH;
    },
    [columnSizes],
  );

  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      if (resizingColumn === null) return;

      const deltaX = event.clientX - resizeStartX.current;
      const currentColumn = columns[resizingColumn];
      const defaultWidth =
        columnSizes[resizingColumn] ??
        currentColumn.minSize ??
        currentColumn.size ??
        DEFAULT_COLUMN_WIDTH;
      const minWidth = getMinColumnWidth(currentColumn, defaultWidth);
      const newWidth = Math.max(minWidth, resizeStartWidth.current + deltaX);

      setColumnSizes({
        ...columnSizes,
        [resizingColumn]: newWidth,
      });
    },
    [resizingColumn, columnSizes, columns, getMinColumnWidth, setColumnSizes],
  );

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  // Event listeners for resizing - fixed to avoid memory leaks
  useEffect(() => {
    if (resizingColumn === null) return;

    const handleMove = (event: MouseEvent) => handleResizeMove(event);
    const handleEnd = () => handleResizeEnd();

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
    };
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  const mergedColumnSizes = useMemo(() => {
    const merged: Record<number, number> = {};
    columns.forEach((col, idx) => {
      merged[idx] =
        columnSizes[idx] ?? col.minSize ?? col.size ?? DEFAULT_COLUMN_WIDTH;
    });
    return merged;
  }, [columns, columnSizes]);

  return {
    columnSizes: mergedColumnSizes,
    resizingColumn,
    handleResizeStart,
  };
}

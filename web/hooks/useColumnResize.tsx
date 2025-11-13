import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/services/hooks/localStorage";

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

  // Initialize column sizes from minSize or default
  const initialColumnSizes = useMemo(() => {
    return columns.reduce(
      (acc, col, idx) => {
        acc[idx] = col.minSize ?? col.size ?? 120;
        return acc;
      },
      {} as Record<number, number>,
    );
  }, [columns]);

  const [columnSizes, setColumnSizes] = useLocalStorage<Record<number, number>>(
    `${tableId}-column-sizes`,
    initialColumnSizes,
  );

  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Measure actual text width using Canvas API with error handling
  const measureTextWidth = useCallback((text: string, font: string): number => {
    if (typeof document === "undefined") return 0;

    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      const context = canvasRef.current.getContext("2d");
      if (!context) return 0;

      context.font = font;
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
      if (!header) return 60; // Minimum if no header text

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
      const currentColumn = columns[resizingColumn];
      const defaultWidth =
        columnSizes[resizingColumn] ??
        currentColumn.minSize ??
        currentColumn.size ??
        120;
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

  // Update column sizes when columns change - with memoization
  const shouldUpdateSizes = useMemo(() => {
    return columns.some((col, idx) => columnSizes[idx] === undefined);
  }, [columns.length, columnSizes]);

  useEffect(() => {
    if (!shouldUpdateSizes) return;

    const newSizes: Record<number, number> = {};
    columns.forEach((col, idx) => {
      if (columnSizes[idx] === undefined) {
        newSizes[idx] = col.minSize ?? col.size ?? 120;
      } else {
        newSizes[idx] = columnSizes[idx];
      }
    });

    setColumnSizes(newSizes);
  }, [shouldUpdateSizes, columns, columnSizes, setColumnSizes]);

  return {
    columnSizes,
    resizingColumn,
    handleResizeStart,
  };
}

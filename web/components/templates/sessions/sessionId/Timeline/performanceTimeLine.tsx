import { cn } from "@/lib/utils";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { TimelineItem, TimelineSection } from "../lib/types";
import { ColorContext } from "../Tree/TreeView";

interface PerformanceTimelineProps {
  data: {
    timeRange: [number, number];
    items: TimelineItem[];
    sections: TimelineSection[];
  };
  onItemClick?: (item: string) => void;
}

interface TooltipPosition {
  x: number;
  y: number;
}

// Constants
const TIMELINE_CONSTANTS = {
  // Allow more compression with smaller MIN_PIXELS_PER_MS
  MIN_PIXELS_PER_MS: 0.02, // Lower minimum scale to allow more compression for long timelines
  MAX_PIXELS_PER_MS: 1.0, // Reduce max scale to prevent excessive spreading
  BAR_HEIGHT: 14, // Slightly smaller bars to fit more vertically
  BAR_SPACING: 6, // Slightly less spacing to fit more vertically
  SECTION_SPACING: 8, // Slightly less section spacing
  MARKER_INTERVAL: 200,
  INITIAL_Y: 28, // Start closer to the top
  PADDING_RIGHT: 100, // Lower padding to maximize horizontal space
} as const;

const MINIMAP_CONSTANTS = {
  WIDTH: 150,
  HEIGHT: 80,
  PADDING: 8,
  BAR_HEIGHT: 2, // Make minimap bars smaller
  BAR_SPACING: 1, // Tighter spacing in minimap
} as const;

export default function PerformanceTimeline({
  data,
  onItemClick,
}: PerformanceTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<TimelineItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);

  // Use refs instead of state for values that don't need to trigger re-renders
  const scrollPositionRef = useRef(0);
  const canvasWidthRef = useRef(0);
  const containerWidthRef = useRef(0);
  const pixelsPerMsRef = useRef(0);
  const minimapHandlePositionRef = useRef({ x: 0, y: 0 });

  const { colors } = useContext(ColorContext);
  const { timeRange, items, sections } = data;

  const [minTime, maxTime] = timeRange;

  const timeSpan = maxTime - minTime;

  // Calculate dynamic pixelsPerMs to fit the timeline in the container
  const calculatePixelsPerMs = useCallback(() => {
    if (containerWidthRef.current === 0 || timeSpan === 0)
      return TIMELINE_CONSTANTS.MIN_PIXELS_PER_MS;

    // Calculate optimal pixels per ms to fit timeline within container width
    // with minimal padding on the right
    const availableWidth = containerWidthRef.current - 50; // Reduce padding to use more space
    const optimalPixelsPerMs = availableWidth / timeSpan;

    // Constrain to min/max values to prevent extreme scaling
    return Math.max(
      TIMELINE_CONSTANTS.MIN_PIXELS_PER_MS,
      Math.min(TIMELINE_CONSTANTS.MAX_PIXELS_PER_MS, optimalPixelsPerMs)
    );
  }, [timeSpan]);

  // Function to update the minimap
  const updateMinimap = useCallback(() => {
    const minimap = minimapRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!minimap || !scrollContainer) return;
    const ctx = minimap.getContext("2d");
    if (!ctx) return;

    // Setup
    const dpr = window.devicePixelRatio || 1;
    const minimapWidthPx = MINIMAP_CONSTANTS.WIDTH;
    const minimapHeightPx = MINIMAP_CONSTANTS.HEIGHT;
    minimap.width = minimapWidthPx * dpr;
    minimap.height = minimapHeightPx * dpr;
    minimap.style.width = `${minimapWidthPx}px`;
    minimap.style.height = `${minimapHeightPx}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, minimapWidthPx, minimapHeightPx);
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, minimapWidthPx, minimapHeightPx);

    // Get scroll/content dimensions
    const scrollableWidth = scrollContainer.scrollWidth;
    const scrollableHeight = scrollContainer.scrollHeight;
    if (scrollableWidth <= 0 || scrollableHeight <= 0) {
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1 / dpr;
      ctx.strokeRect(0, 0, minimapWidthPx, minimapHeightPx);
      return;
    }

    // Calculate scales
    const padding = 5;
    const availableMinimapWidth = minimapWidthPx - 2 * padding;
    const availableMinimapHeight = minimapHeightPx - 2 * padding;
    const xScale = availableMinimapWidth / scrollableWidth;
    const yScale = availableMinimapHeight / scrollableHeight;

    // Draw scaled items
    const minimapBarHeight = Math.max(
      1,
      TIMELINE_CONSTANTS.BAR_HEIGHT * yScale
    );
    const minimapBarSpacing = TIMELINE_CONSTANTS.BAR_SPACING * yScale;
    const minimapSectionSpacing = TIMELINE_CONSTANTS.SECTION_SPACING * yScale;
    let scaledCurrentY = TIMELINE_CONSTANTS.INITIAL_Y * yScale + padding;
    const sectionItems = getItemsGroupedBySection(items, sections);

    sections.forEach((section) => {
      const sectionColor = colors[section.id] || "black";
      const itemsInSection = sectionItems[section.id];
      if (itemsInSection.length > 0) {
        itemsInSection.forEach((item) => {
          // Use main canvas scale for relative X positioning
          // Get the current scale factor for time-to-pixels conversion
          const mainPixelsPerMs = pixelsPerMsRef.current;

          // Calculate item's start position in the main timeline (in pixels)
          const logicalStartX =
            mainPixelsPerMs > 0
              ? (item.startTime - minTime) * mainPixelsPerMs
              : 0;

          // Calculate item's end position in the main timeline (in pixels)
          const logicalEndX =
            mainPixelsPerMs > 0
              ? (item.endTime - minTime) * mainPixelsPerMs
              : 0;

          // Calculate width, ensuring it's at least 1 pixel when scaled
          const logicalWidth = Math.max(
            1 / xScale,
            logicalEndX - logicalStartX
          );

          // Scale the positions to fit in the minimap and add padding
          const startX = logicalStartX * xScale + padding;
          const width = logicalWidth * xScale;

          ctx.fillStyle = sectionColor;
          ctx.beginPath();
          ctx.rect(
            startX,
            scaledCurrentY,
            Math.max(1, width),
            minimapBarHeight
          );
          ctx.fill();
          scaledCurrentY += minimapBarHeight + minimapBarSpacing;
        });
        scaledCurrentY += minimapSectionSpacing;
      }
    });

    // Draw viewport indicator
    const scrollLeft = scrollContainer.scrollLeft;
    const scrollTop = scrollContainer.scrollTop;
    const visibleWidth = scrollContainer.clientWidth;
    const visibleHeight = scrollContainer.clientHeight;
    const viewportX = scrollLeft * xScale + padding;
    const viewportY = scrollTop * yScale + padding;
    const viewportWidth = visibleWidth * xScale;
    const viewportHeight = visibleHeight * yScale;

    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2 / dpr;
    ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
    ctx.fillStyle = "rgba(14, 165, 233, 0.15)";
    ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
    minimapHandlePositionRef.current = {
      x: viewportX + viewportWidth / 2,
      y: viewportY + viewportHeight / 2,
    };

    // Draw border
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1 / dpr;
    ctx.strokeRect(0, 0, minimapWidthPx, minimapHeightPx);
  }, [sections, items, colors, minTime]);

  useEffect(() => {
    if (!canvasRef.current || containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        console.log("johnlegends", containerRef.current);
        const width = containerRef.current.getBoundingClientRect().width;
        containerWidthRef.current = width;

        // Recalculate pixels per ms based on new container width
        pixelsPerMsRef.current = calculatePixelsPerMs();

        // Redraw canvas with new dimensions
        drawCanvas();
      }
    };

    // Initial dimensions
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, [calculatePixelsPerMs]);

  // Draw the main canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixelsPerMs = pixelsPerMsRef.current;
    const timeSpan = maxTime - minTime;
    const [contentWidth, height] = calculateCanvasDimensions(
      timeSpan,
      pixelsPerMs,
      items,
      sections
    );

    const totalWidth = Math.max(contentWidth, containerWidthRef.current);
    canvasWidthRef.current = totalWidth;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, totalWidth, height);

    // 1. Draw time markers FIRST
    drawTimeMarkers(ctx, minTime, maxTime, height, pixelsPerMs, totalWidth);

    // 3. Draw timeline items
    drawTimelineItems(
      ctx,
      items,
      sections,
      minTime,
      hoveredItem,
      pixelsPerMs,
      colors
    );

    updateMinimap(); // Call directly
  }, [
    minTime,
    maxTime,
    timeSpan,
    items,
    sections,
    hoveredItem,
    colors,
    updateMinimap,
  ]);

  // Draw the canvas when dependencies change
  useEffect(() => {
    // Calculate initial pixels per ms
    pixelsPerMsRef.current = calculatePixelsPerMs();
    drawCanvas();
  }, [calculatePixelsPerMs, drawCanvas]);

  // Handle mouse move events
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!canvas || !container || !scrollContainer) return;

    const handleMouseMove = createMouseMoveHandler(
      canvas,
      scrollContainer,
      sections,
      items,
      setHoveredItem,
      setTooltipPosition,
      setShowTooltip
    );

    const handleMouseLeave = createMouseLeaveHandler(
      setHoveredItem,
      setShowTooltip
    );

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", () => {
      if (hoveredItem && onItemClick) {
        onItemClick(hoveredItem.id);
      }
    });

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", () => {
        if (hoveredItem && onItemClick) {
          onItemClick(hoveredItem.id);
        }
      });
    };
  }, [minTime, items, sections, hoveredItem, onItemClick]);

  // Effect for main scroll container events
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    const handleScroll = () => {
      scrollPositionRef.current = scrollContainer.scrollLeft;
      // updateMinimap called here will use the timeSpan captured
      // when the updateMinimap callback was created by drawCanvas
      updateMinimap(); // Pass the current timespan explicitly
    };
    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [updateMinimap, minTime, maxTime]); // Depend on updateMinimap and the time bounds

  // Handle mouse interactions with the minimap
  useEffect(() => {
    const minimap = minimapRef.current;
    if (!minimap) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDraggingMinimap(true);
      handleMinimapClick(e);
      e.preventDefault();
    };

    const handleMinimapClick = (e: MouseEvent) => {
      const scrollContainer = scrollContainerRef.current;
      if (!minimap || !scrollContainer) return;

      const rect = minimap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const minimapWidth = MINIMAP_CONSTANTS.WIDTH;
      const minimapHeight = MINIMAP_CONSTANTS.HEIGHT;
      const clampedX = Math.max(0, Math.min(x, minimapWidth));
      const clampedY = Math.max(0, Math.min(y, minimapHeight));

      const xRatio = clampedX / minimapWidth;
      const yRatio = clampedY / minimapHeight;

      const scrollableWidth = scrollContainer.scrollWidth;
      const scrollableHeight = scrollContainer.scrollHeight;
      const targetScrollX = xRatio * scrollableWidth;
      const targetScrollY = yRatio * scrollableHeight;

      scrollContainer.scrollTo({
        left: Math.max(0, targetScrollX - scrollContainer.clientWidth / 2),
        top: Math.max(0, targetScrollY - scrollContainer.clientHeight / 2),
        behavior: "auto",
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMinimap) {
        handleMinimapClick(e);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingMinimap) {
        setIsDraggingMinimap(false);
      }
    };

    minimap.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      minimap.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingMinimap]);

  // Handle scroll button clicks

  return (
    <div
      ref={containerRef}
      className="relative border border-gray-200 rounded-lg overflow-hidden bg-white"
    >
      {/* Scroll container - updated with overflow-y */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto max-h-[400px] w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        <canvas ref={canvasRef} className="cursor-pointer" />
      </div>

      {/* Minimap in top right corner */}
      <div className="absolute top-6 right-4 z-10">
        <canvas
          ref={minimapRef}
          className="w-[150px] h-[80px] cursor-pointer shadow-lg"
          style={{
            cursor: isDraggingMinimap ? "grabbing" : "grab",
          }}
        />
      </div>

      {showTooltip && hoveredItem && (
        <ToolTipComponent
          hoveredItem={hoveredItem}
          tooltipPosition={tooltipPosition}
        />
      )}
    </div>
  );
}

function ToolTipComponent({
  hoveredItem,
  tooltipPosition,
}: {
  hoveredItem: TimelineItem;
  tooltipPosition: TooltipPosition;
}) {
  return (
    <div
      className="fixed z-20 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm"
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        width: "250px",
        transform: "translate(16px, 8px)", // Small offset from cursor
        pointerEvents: "none",
      }}
    >
      <div className="font-medium">{hoveredItem.label || "Task"}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
        <div className="text-gray-500">Model:</div>
        <div>{hoveredItem.model || "N/A"}</div>
        <div className="text-gray-500">Cost:</div>
        <div>${hoveredItem.cost?.toFixed(5) || "0.00000"}</div>
        <div className="text-gray-500">Duration:</div>
        <div>{hoveredItem.endTime - hoveredItem.startTime} s</div>
        {hoveredItem.status && (
          <>
            <div className="text-gray-500">Status:</div>
            <div
              className={cn(
                hoveredItem.status === "success"
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {hoveredItem.status}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper functions
function lightenColor(color: string, amount: number): string {
  // Convert hex to RGB
  let r = Number.parseInt(color.slice(1, 3), 16);
  let g = Number.parseInt(color.slice(3, 5), 16);
  let b = Number.parseInt(color.slice(5, 7), 16);

  // Lighten
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function getItemsGroupedBySection(
  items: TimelineItem[],
  sections: TimelineSection[]
) {
  const sectionItems: Record<string, TimelineItem[]> = {};
  sections.forEach((section) => {
    sectionItems[section.id] = items.filter(
      (item) => item.section === section.id
    );
  });
  return sectionItems;
}

// Canvas drawing timeline markers with lines
function drawTimeMarkers(
  ctx: CanvasRenderingContext2D,
  minTime: number,
  maxTime: number,
  height: number,
  pixelsPerMs: number,
  totalWidth: number
) {
  const timeSpan = maxTime - minTime;
  if (timeSpan <= 0 || pixelsPerMs <= 0) return;
  const optimalMarkerCount = 5;
  const markerInterval = Math.ceil(timeSpan / optimalMarkerCount / 100) * 100;
  const timeMarkers = [];
  for (let time = minTime; time <= maxTime; time += markerInterval) {
    timeMarkers.push(time);
  }
  const markerY = 20;
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  timeMarkers.forEach((time) => {
    const x = (time - minTime) * pixelsPerMs;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.fillText(`${time} s`, x + 5, markerY);
  });

  // 2. Draw the horizontal line UNDER the markers
  const lineY =
    TIMELINE_CONSTANTS.INITIAL_Y - TIMELINE_CONSTANTS.SECTION_SPACING / 2;
  ctx.beginPath();
  ctx.moveTo(0, lineY); // Start slightly offset for crispness
  ctx.lineTo(totalWidth, lineY); // Draw across the entire width
  ctx.strokeStyle = "#e2e8f0"; // Use a light gray color (same as markers)
  ctx.lineWidth = 1; // Standard line width
  ctx.stroke();
}

function drawTimelineItems(
  ctx: CanvasRenderingContext2D,
  items: TimelineItem[],
  sections: TimelineSection[],
  minTime: number,
  hoveredItem: TimelineItem | null,
  pixelsPerMs: number,
  colors: Record<string, string>
) {
  let currentY = TIMELINE_CONSTANTS.INITIAL_Y;
  const sectionItems = getItemsGroupedBySection(items, sections);
  const MINIMUM_BAR_WIDTH = 4; // Ensure bars are always at least 6px wide

  sections.forEach((section) => {
    const sectionColor = colors[section.id] || "black";

    sectionItems[section.id].forEach((item) => {
      const startX = (item.startTime - minTime) * pixelsPerMs;
      const endX = (item.endTime - minTime) * pixelsPerMs;
      // Ensure the bar has a minimum width to be visible
      const itemWidth = Math.max(MINIMUM_BAR_WIDTH, endX - startX);

      // Check if this row is hovered
      const isRowHovered = hoveredItem?.id === item.id;

      // Draw row highlight if hovered
      if (isRowHovered) {
        ctx.fillStyle = "rgba(229, 231, 235, 0.5)"; // Light grey with transparency
        ctx.fillRect(
          0, // Start from left edge
          currentY - 1, // Slightly above the bar
          ctx.canvas.width, // Span the entire width
          TIMELINE_CONSTANTS.BAR_HEIGHT + 2 // Slightly taller than the bar
        );
      }

      // Draw the actual bar
      ctx.fillStyle = isRowHovered
        ? lightenColor(sectionColor, 0.3) // More pronounced lightening when hovered
        : sectionColor;

      ctx.beginPath();
      ctx.roundRect(
        startX,
        currentY,
        itemWidth,
        TIMELINE_CONSTANTS.BAR_HEIGHT,
        3 // Slightly smaller corner radius
      );
      ctx.fill();

      // Add border to make small bars more visible
      if (itemWidth < 10) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      if (item.status === "error") {
        drawErrorIndicator(
          ctx,
          Math.max(endX, startX + MINIMUM_BAR_WIDTH),
          currentY
        );
      }

      // Only draw label if there's enough space - with min width reduced
      if (itemWidth > 30 && item.label) {
        drawItemLabel(ctx, item.label, startX, currentY, itemWidth);
      }

      currentY +=
        TIMELINE_CONSTANTS.BAR_HEIGHT + TIMELINE_CONSTANTS.BAR_SPACING;
    });

    currentY += TIMELINE_CONSTANTS.SECTION_SPACING;
  });
}

function drawErrorIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(x - 8, y + TIMELINE_CONSTANTS.BAR_HEIGHT / 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillText("×", x - 10.5, y + TIMELINE_CONSTANTS.BAR_HEIGHT / 2 + 3);
}

function drawItemLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  width: number
) {
  ctx.fillStyle = "#ffffff";
  ctx.font = "10px Inter, system-ui, sans-serif"; // Slightly smaller font

  // Adapt label length to available width
  let displayLabel = label;
  if (width < 100 && label.length > 10) {
    displayLabel = label.substring(0, 8) + "...";
  } else if (width < 200 && label.length > 15) {
    displayLabel = label.substring(0, 13) + "...";
  }

  ctx.fillText(
    displayLabel,
    x + 4, // Less padding
    y + TIMELINE_CONSTANTS.BAR_HEIGHT / 2 + 3
  );
}

// Event handler factories
function createMouseMoveHandler(
  canvas: HTMLCanvasElement,
  scrollContainer: HTMLDivElement | null,
  sections: TimelineSection[],
  items: TimelineItem[],
  setHoveredItem: (item: TimelineItem | null) => void,
  setTooltipPosition: (position: TooltipPosition) => void,
  setShowTooltip: (show: boolean) => void
) {
  return (e: MouseEvent) => {
    if (!scrollContainer) return;

    const canvasRect = canvas.getBoundingClientRect();
    const y = e.clientY - canvasRect.top;

    // Improved item detection that's more forgiving with vertical position
    const extendedRowHeight =
      TIMELINE_CONSTANTS.BAR_HEIGHT + TIMELINE_CONSTANTS.BAR_SPACING;

    let foundItem = null;
    let currentY = TIMELINE_CONSTANTS.INITIAL_Y;

    // Find the hovered item based on Y position
    sections.forEach((section) => {
      const sectionStartY = currentY;
      const sectionItems = items.filter((item) => item.section === section.id);
      const sectionHeight = sectionItems.length * extendedRowHeight;

      // If cursor is within this section's Y-range
      if (y >= sectionStartY && y < sectionStartY + sectionHeight) {
        const rowIndex = Math.floor((y - sectionStartY) / extendedRowHeight);
        if (rowIndex >= 0 && rowIndex < sectionItems.length) {
          foundItem = sectionItems[rowIndex];
        }
      }

      currentY += sectionHeight + TIMELINE_CONSTANTS.SECTION_SPACING;
    });

    setHoveredItem(foundItem);
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY,
    });
    setShowTooltip(!!foundItem);
  };
}

function createMouseLeaveHandler(
  setHoveredItem: (item: TimelineItem | null) => void,
  setShowTooltip: (show: boolean) => void
) {
  return () => {
    setHoveredItem(null);
    setShowTooltip(false);
  };
}

// Create a new function to calculate dimensions
function calculateCanvasDimensions(
  timeSpan: number,
  pixelsPerMs: number,
  items: TimelineItem[],
  sections: TimelineSection[]
): [number, number] {
  // Calculate height
  let totalHeight = TIMELINE_CONSTANTS.INITIAL_Y;
  const sectionItems = getItemsGroupedBySection(items, sections);

  sections.forEach((section) => {
    const itemsCount = sectionItems[section.id].length;
    totalHeight +=
      itemsCount *
      (TIMELINE_CONSTANTS.BAR_HEIGHT + TIMELINE_CONSTANTS.BAR_SPACING);

    if (itemsCount > 0) {
      totalHeight += TIMELINE_CONSTANTS.SECTION_SPACING;
    }
  });
  totalHeight += 40; // Padding
  const finalHeight = Math.max(totalHeight, 400);

  // Calculate width based on time
  const contentWidth =
    timeSpan * pixelsPerMs + TIMELINE_CONSTANTS.PADDING_RIGHT;

  return [contentWidth, finalHeight];
}

"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { TimelineItem, TimelineSection } from "../lib/types";
import { ColorContext } from "../Tree/TreeView";

interface PerformanceTimelineProps {
  data: {
    timeRange: [number, number];
    items: TimelineItem[];
    sections: TimelineSection[];
  };
}

interface TooltipPosition {
  x: number;
  y: number;
}

// Constants
const TIMELINE_CONSTANTS = {
  HEIGHT: 400,
  // Allow more compression with smaller MIN_PIXELS_PER_MS
  MIN_PIXELS_PER_MS: 0.02, // Lower minimum scale to allow more compression for long timelines
  MAX_PIXELS_PER_MS: 1.0, // Reduce max scale to prevent excessive spreading
  BAR_HEIGHT: 14, // Slightly smaller bars to fit more vertically
  BAR_SPACING: 6, // Slightly less spacing to fit more vertically
  SECTION_SPACING: 8, // Slightly less section spacing
  MARKER_INTERVAL: 200,
  INITIAL_Y: 24, // Start closer to the top
  PADDING_RIGHT: 100, // Lower padding to maximize horizontal space
} as const;

const MINIMAP_CONSTANTS = {
  WIDTH: 150,
  HEIGHT: 80,
  PADDING: 8,
  BAR_HEIGHT: 4,
  BAR_SPACING: 2,
} as const;

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
  pixelsPerMs: number
) {
  // Dynamically calculate marker interval based on scale
  const optimalMarkerCount = 5; // Target number of markers
  const timeSpan = maxTime - minTime;
  const markerInterval = Math.ceil(timeSpan / optimalMarkerCount / 100) * 100; // Round to nearest 100ms

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
    ctx.fillText(`${time} ms`, x + 5, markerY);
  });
}

function drawTimelineItems(
  ctx: CanvasRenderingContext2D,
  items: TimelineItem[],
  sections: TimelineSection[],
  minTime: number,
  hoveredItem: TimelineItem | null,
  hoveredSection: string | null,
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

      // Check if this row is hovered (either the item or its section)
      const isRowHovered =
        hoveredItem?.id === item.id || hoveredSection === item.section;

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
  setHoveredSection: (section: string | null) => void,
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
    let foundSection = null;
    let currentY = TIMELINE_CONSTANTS.INITIAL_Y;

    // Group items by section

    // Find the hovered section and item based on Y position
    sections.forEach((section) => {
      const sectionStartY = currentY;
      const sectionItems = items.filter((item) => item.section === section.id);
      const sectionHeight = sectionItems.length * extendedRowHeight;

      // If cursor is within this section's Y-range
      if (y >= sectionStartY && y < sectionStartY + sectionHeight) {
        foundSection = section.id;

        // Calculate which row within the section is being hovered
        const rowIndex = Math.floor((y - sectionStartY) / extendedRowHeight);
        if (rowIndex >= 0 && rowIndex < sectionItems.length) {
          foundItem = sectionItems[rowIndex];
        }
      }

      currentY += sectionHeight + TIMELINE_CONSTANTS.SECTION_SPACING;
    });

    setHoveredItem(foundItem);
    setHoveredSection(foundSection);
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY,
    });
    setShowTooltip(!!foundItem);
  };
}

function createMouseLeaveHandler(
  setHoveredItem: (item: TimelineItem | null) => void,
  setHoveredSection: (section: string | null) => void,
  setShowTooltip: (show: boolean) => void
) {
  return () => {
    setHoveredItem(null);
    setHoveredSection(null);
    setShowTooltip(false);
  };
}

export default function PerformanceTimeline({
  data,
}: PerformanceTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<TimelineItem | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

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
    if (!minimap) return;

    const ctx = minimap.getContext("2d");
    if (!ctx) return;

    // Set minimap dimensions
    const dpr = window.devicePixelRatio || 1;
    const width = MINIMAP_CONSTANTS.WIDTH * dpr;
    const height = MINIMAP_CONSTANTS.HEIGHT * dpr;
    minimap.width = width;
    minimap.height = height;
    minimap.style.width = "150px";
    minimap.style.height = "80px";
    ctx.scale(dpr, dpr);

    // Clear minimap
    ctx.clearRect(10, 0, width, height);

    // Draw background
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, 150, 80);

    // Draw border
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 150, 80);

    // Draw timeline items in minimap with padding
    const barHeight = MINIMAP_CONSTANTS.BAR_HEIGHT;
    const barSpacing = MINIMAP_CONSTANTS.BAR_SPACING;
    let currentY = 10;
    const minimapPadding = MINIMAP_CONSTANTS.PADDING;
    const minimapContentWidth = MINIMAP_CONSTANTS.WIDTH - minimapPadding * 2;

    // Group items by section
    const sectionItems: Record<string, TimelineItem[]> = {};
    sections.forEach((section) => {
      sectionItems[section.id] = items.filter(
        (item) => item.section === section.id
      );
    });

    // Draw items for each section
    sections.forEach((section) => {
      const sectionColor = colors[section.id] || "black";

      sectionItems[section.id].forEach((item) => {
        const startX =
          ((item.startTime - minTime) / timeSpan) * minimapContentWidth +
          minimapPadding;
        const endX =
          ((item.endTime - minTime) / timeSpan) * minimapContentWidth +
          minimapPadding;
        const width = Math.max(1, endX - startX); // Ensure minimum width

        // Draw bar
        ctx.fillStyle = sectionColor;
        ctx.beginPath();
        ctx.roundRect(startX, currentY, width, barHeight, 2);
        ctx.fill();

        currentY += barHeight + barSpacing;
      });

      // Add extra spacing between sections
      currentY += 2;
    });

    // Calculate the visible portion based on scroll position
    const scrollContainer = scrollContainerRef.current;
    if (
      scrollContainer &&
      canvasWidthRef.current > 0 &&
      containerWidthRef.current > 0
    ) {
      const scrollLeft = scrollPositionRef.current;
      const visibleWidth = containerWidthRef.current;

      // Calculate ratios based on total canvas width
      const totalWidth = canvasWidthRef.current;
      const visibleStartRatio = scrollLeft / totalWidth;
      const visibleEndRatio = Math.min(
        1,
        (scrollLeft + visibleWidth) / totalWidth
      );

      // Apply the ratios to minimap width (150px)
      const visibleStartX = visibleStartRatio * 150;
      const visibleEndX = visibleEndRatio * 150;

      // Draw semi-transparent overlay for areas outside viewport
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillRect(0, 0, visibleStartX, 80);
      ctx.fillRect(visibleEndX, 0, 150 - visibleEndX, 80);

      // Update handle position for dragging
      minimapHandlePositionRef.current = { x: visibleEndX, y: 70 };
    }
  }, [sections, items, colors, minTime, timeSpan]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const updateDimensions = () => {
      if (container) {
        const width = container.getBoundingClientRect().width;
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

  // Draw the canvas based on current dimensions and scale
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use the current pixelsPerMs value
    const pixelsPerMs = pixelsPerMsRef.current;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const height = TIMELINE_CONSTANTS.HEIGHT;

    // Calculate total width based on time span and current scale
    const totalWidth =
      timeSpan * pixelsPerMs + TIMELINE_CONSTANTS.PADDING_RIGHT;
    canvasWidthRef.current = totalWidth;

    // Set both the canvas buffer size and display size
    canvas.width = totalWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, totalWidth, height);

    // Draw time markers
    drawTimeMarkers(ctx, minTime, maxTime, height, pixelsPerMs);

    // Draw timeline items
    drawTimelineItems(
      ctx,
      items,
      sections,
      minTime,
      hoveredItem,
      hoveredSection,
      pixelsPerMs,
      colors
    );

    // Update minimap to reflect new canvas
    updateMinimap();
  }, [
    minTime,
    maxTime,
    timeSpan,
    items,
    sections,
    hoveredItem,
    hoveredSection,
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
      setHoveredSection,
      setTooltipPosition,
      setShowTooltip
    );

    const handleMouseLeave = createMouseLeaveHandler(
      setHoveredItem,
      setHoveredSection,
      setShowTooltip
    );

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [minTime, items, sections]);

  // Handle scroll events
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      scrollPositionRef.current = scrollLeft;

      // Update scroll indicators
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(
        scrollLeft < canvasWidthRef.current - containerWidthRef.current - 10
      );

      // Update minimap without causing re-renders
      updateMinimap();
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [updateMinimap]);

  // Handle mouse interactions with the minimap
  useEffect(() => {
    const minimap = minimapRef.current;
    if (!minimap) return;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = minimap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking on the handle
      const handlePos = minimapHandlePositionRef.current;
      const distance = Math.sqrt(
        Math.pow(x - handlePos.x, 2) + Math.pow(y - handlePos.y, 2)
      );

      if (distance <= 12) {
        setIsDraggingMinimap(true);
      } else {
        // Check if clicking on the minimap area
        if (x >= 0 && x <= 150 && y >= 0 && y <= 80) {
          // Calculate the position in the timeline
          const clickedRatio = x / 150;
          const scrollTarget = clickedRatio * canvasWidthRef.current;

          // Scroll to that position
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              left: scrollTarget - containerWidthRef.current / 2,
              behavior: "smooth",
            });
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMinimap) {
        const rect = minimap.getBoundingClientRect();
        const x = Math.max(0, Math.min(150, e.clientX - rect.left));

        // Calculate the position in the timeline
        const dragRatio = x / 150;
        const scrollTarget = dragRatio * canvasWidthRef.current;

        // Scroll to that position
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollTarget;
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingMinimap(false);
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
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -containerWidthRef.current / 2,
        behavior: "smooth",
      });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: containerWidthRef.current / 2,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative border border-gray-200 rounded-lg overflow-hidden bg-white"
      >
        {/* Scroll container - updated with overflow-y */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-auto max-h-[500px] w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          style={{ height: `${TIMELINE_CONSTANTS.HEIGHT}px` }}
        >
          <canvas ref={canvasRef} className="cursor-pointer" />
        </div>

        {/* Scroll indicators */}
        {showLeftScroll && (
          <button
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md z-10 opacity-80 hover:opacity-100"
            onClick={handleScrollLeft}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {showRightScroll && (
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md z-10 opacity-80 hover:opacity-100"
            onClick={handleScrollRight}
          >
            <ChevronRight size={20} />
          </button>
        )}

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
          <div
            className="fixed z-20 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              width: "250px",
              transform: "translate(15px, 15px)", // Small offset from cursor
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
              <div>{hoveredItem.endTime - hoveredItem.startTime} ms</div>
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
        )}
      </div>
    </div>
  );
}

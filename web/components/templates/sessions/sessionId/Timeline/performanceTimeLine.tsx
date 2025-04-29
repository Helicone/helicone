"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TimelineItem, TimelineSection } from "../lib/types";
import TimelineTable from "./timelineTable";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function PerformanceTimeline({
  data,
}: PerformanceTimelineProps) {
  // Add timeline height constant
  const TIMELINE_HEIGHT = 400; // Adjust this value to change the height
  const PIXELPERMS = 1.2; // Adjust this value to change the zoom level
  const ENDING_PADDING = PIXELPERMS * 100; // Scale padding with zoom level - 100ms worth of padding

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
  const minimapHandlePositionRef = useRef({ x: 0, y: 0 });
  const { timeRange, items, sections } = data;

  const [minTime, maxTime] = timeRange;
  const timeSpan = maxTime - minTime;
  const totalTimelineWidth = timeSpan * PIXELPERMS + ENDING_PADDING; // Add padding to total width

  // Calculate the total width needed for the timeline
  // We'll use a fixed width per millisecond to ensure consistent scaling

  // Colors for different status types
  const colors = {
    success: "#4ade80",
    error: "#ef4444",
    default: "#3b82f6",
    abstract: "#94a3b8",
    outline: "#f97316",
    introduction: "#8b5cf6",
    "key technologies": "#ec4899",
    quiz: "#f59e0b",
  };

  // Function to update the minimap - Restore this function
  const updateMinimap = useCallback(() => {
    const minimap = minimapRef.current;
    if (!minimap) return;

    const ctx = minimap.getContext("2d");
    if (!ctx) return;

    // Set minimap dimensions
    const dpr = window.devicePixelRatio || 1;
    const width = 150 * dpr;
    const height = 80 * dpr;
    minimap.width = width;
    minimap.height = height;
    minimap.style.width = "150px";
    minimap.style.height = "80px";
    ctx.scale(dpr, dpr);

    // Clear minimap
    ctx.clearRect(10, 0, width, height);

    // Draw background
    ctx.fillStyle = "#f1f5f9"; // Example color
    ctx.fillRect(0, 0, 150, 80);

    // Draw border
    ctx.strokeStyle = "#cbd5e1"; // Example color
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 150, 80);

    // Draw timeline items in minimap with padding
    const barHeight = 4;
    const barSpacing = 2;
    let currentY = 10;
    const minimapPadding = 8; // Add padding to minimap
    const minimapContentWidth = 150 - minimapPadding * 2; // Adjust content width for padding

    // Group items by section
    const sectionItems: Record<string, TimelineItem[]> = {};
    sections.forEach((section) => {
      sectionItems[section.id] = items.filter(
        (item) => item.section === section.id
      );
    });

    // Draw items for each section
    sections.forEach((section) => {
      const sectionColor =
        colors[section.id as keyof typeof colors] || colors.default;

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

      // Calculate ratios including the padding
      const totalWidth = timeSpan * PIXELPERMS + ENDING_PADDING;
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

      // Update handle position for dragging (using ref instead of state)
      minimapHandlePositionRef.current = { x: visibleEndX, y: 70 };
    }
  }, [sections, items, colors, minTime, timeSpan, ENDING_PADDING]);

  // Helper function to lighten a color - Restore inside component scope
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const updateDimensions = () => {
      if (container) {
        const width = container.getBoundingClientRect().width;
        containerWidthRef.current = width;
      }
    };
    updateDimensions(); // Initial dimensions
    window.addEventListener("resize", updateDimensions);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const height = TIMELINE_HEIGHT;
    const width = totalTimelineWidth;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvasWidthRef.current = width;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw time markers
    const timeMarkers = [];
    const markerInterval = 200;
    for (let time = minTime; time <= maxTime; time += markerInterval) {
      timeMarkers.push(time);
    }
    const markerY = 20;
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    timeMarkers.forEach((time) => {
      const x = (time - minTime) * PIXELPERMS;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.fillText(`${time} ms`, x + 5, markerY);
    });

    // Draw timeline items
    const barHeight = 16;
    const barSpacing = 8;
    let currentY = 50;

    const sectionItems: Record<string, TimelineItem[]> = {};
    sections.forEach((section) => {
      sectionItems[section.id] = items.filter(
        (item) => item.section === section.id
      );
    });

    sections.forEach((section) => {
      const sectionColor =
        colors[section.id as keyof typeof colors] || colors.default;

      sectionItems[section.id].forEach((item) => {
        const startX = (item.startTime - minTime) * PIXELPERMS;
        const endX = (item.endTime - minTime) * PIXELPERMS;
        const itemWidth = endX - startX;

        ctx.fillStyle =
          hoveredItem?.id === item.id || hoveredSection === item.section
            ? lightenColor(sectionColor, 0.2)
            : sectionColor;

        ctx.beginPath();
        ctx.roundRect(startX, currentY, itemWidth, barHeight, 4);
        ctx.fill();

        if (item.status === "error") {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(endX - 8, currentY + barHeight / 2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px Inter, system-ui, sans-serif";
          ctx.fillText("×", endX - 10.5, currentY + barHeight / 2 + 3);
        }

        if (itemWidth > 80 && item.label) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "11px Inter, system-ui, sans-serif";
          ctx.fillText(item.label, startX + 6, currentY + barHeight / 2 + 4);
        }

        currentY += barHeight + barSpacing;
      });

      currentY += 10;
    });

    return () => window.removeEventListener("resize", updateDimensions);
  }, [
    minTime,
    maxTime,
    timeSpan,
    items,
    sections,
    hoveredItem,
    hoveredSection,
    colors,
    totalTimelineWidth,
    PIXELPERMS,
    TIMELINE_HEIGHT,
  ]);

  // Original useEffect for mouse move handling (now inside the other effect)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!canvas || !container || !scrollContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = scrollContainer.scrollLeft;
      const x = e.clientX - canvasRect.left + scrollLeft; // Keep x for potential future use, but not for hover check
      const y = e.clientY - canvasRect.top;

      const barHeight = 16;
      const barSpacing = 8;
      let currentY = 50;
      let foundItem = null;
      let foundSection = null;

      // Iterate through sections to track the correct Y position
      sections.forEach((section) => {
        const sectionItems = items.filter(
          (item) => item.section === section.id
        );

        sectionItems.forEach((item) => {
          const itemRowTop = currentY;
          const itemRowBottom = currentY + barHeight;

          // Check only if the mouse Y is within the item's row boundaries
          if (y >= itemRowTop && y <= itemRowBottom) {
            foundItem = item;
            foundSection = section.id;
            const position = calculateTooltipPosition(
              e.clientX,
              e.clientY,
              containerRect
            );
            setTooltipPosition(position);
            // Note: If items could overlap vertically, the last match wins.
            // If we want the first match, we could add a check here and break loops.
          }
          currentY = itemRowBottom + barSpacing; // Move Y to the start of the next item row
        });
        currentY += 10; // Add extra spacing between sections
      });

      setHoveredItem(foundItem);
      setHoveredSection(foundSection);
      setShowTooltip(!!foundItem);
    };

    const handleMouseLeave = () => {
      setHoveredItem(null);
      setHoveredSection(null);
      setShowTooltip(false);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [minTime, items, sections, PIXELPERMS]);

  // Draw the minimap initially
  useEffect(() => {
    updateMinimap();
  }, [updateMinimap]);

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

  // Handle mouse interactions with the main timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const scrollLeft = scrollContainer.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top;

      // Check if mouse is over any item
      const barHeight = 16;
      const barSpacing = 8;
      let currentY = 50;
      let foundItem = null;
      let foundSection = null;

      // Check each section
      sections.forEach((section) => {
        const sectionItems = items.filter(
          (item) => item.section === section.id
        );

        sectionItems.forEach((item) => {
          if (y >= currentY && y <= currentY + barHeight) {
            foundItem = item;
            foundSection = section.id;
            const position = calculateTooltipPosition(
              e.clientX,
              e.clientY,
              rect
            );
            setTooltipPosition(position);
          }

          currentY += barHeight + barSpacing;
        });

        currentY += 10; // Extra spacing between sections
      });

      setHoveredItem(foundItem);
      setHoveredSection(foundSection);
      setShowTooltip(!!foundItem);
    };

    const handleMouseLeave = () => {
      setHoveredItem(null);
      setHoveredSection(null);
      setShowTooltip(false);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [minTime, items, sections, PIXELPERMS]);

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
        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          style={{ height: `${TIMELINE_HEIGHT}px` }}
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
            className="absolute z-20 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              width: "250px",
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

      <TimelineTable
        sections={sections}
        items={items}
        hoveredSection={hoveredSection}
        hoveredItem={hoveredItem}
        onHoverItem={setHoveredItem}
        onHoverSection={setHoveredSection}
      />
    </div>
  );
}

const calculateTooltipPosition = (
  cursorX: number, // Mouse X relative to viewport
  cursorY: number, // Mouse Y relative to viewport
  containerRect: DOMRect, // Container's bounding rect
  tooltipWidth: number = 250, // Tooltip dimensions
  tooltipHeight: number = 120, // Adjust if your tooltip content varies significantly
  padding: number = 15 // Space between cursor and tooltip
): TooltipPosition => {
  // Calculate cursor position relative to the container's top-left corner
  const cursorRelativeToContainerX = cursorX - containerRect.left;
  const cursorRelativeToContainerY = cursorY - containerRect.top;

  // Get container dimensions
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height; // Use the actual container height

  // Default position: right and below cursor, relative to container
  let finalX = cursorRelativeToContainerX + padding;
  let finalY = cursorRelativeToContainerY + padding;

  // Adjust horizontal position (X)
  // If showing right goes off-screen right...
  if (finalX + tooltipWidth > containerWidth) {
    // Try showing left of the cursor instead
    finalX = cursorRelativeToContainerX - tooltipWidth - padding;
    // If showing left *also* goes off-screen left (e.g., narrow container)...
    if (finalX < 0) {
      // Pin to the left edge
      finalX = 0;
      // As a last resort if it *still* overflows (tooltip wider than container), pin to right edge
      if (finalX + tooltipWidth > containerWidth) {
        finalX = Math.max(0, containerWidth - tooltipWidth); // Ensure it doesn't become negative
      }
    }
  }
  // Ensure it didn't somehow end up off-screen left with the default placement
  finalX = Math.max(0, finalX);

  // Adjust vertical position (Y)
  // If showing below goes off-screen bottom...
  if (finalY + tooltipHeight > containerHeight) {
    // Try showing above the cursor instead
    finalY = cursorRelativeToContainerY - tooltipHeight - padding;
    // If showing above *also* goes off-screen top...
    if (finalY < 0) {
      // Pin to the top edge
      finalY = 0;
      // As a last resort if it *still* overflows (tooltip taller than container), pin to bottom edge
      if (finalY + tooltipHeight > containerHeight) {
        finalY = Math.max(0, containerHeight - tooltipHeight); // Ensure it doesn't become negative
      }
    }
  }
  // Ensure it didn't somehow end up off-screen top with the default placement
  finalY = Math.max(0, finalY);

  // Return position relative to the container
  return { x: finalX, y: finalY };
};

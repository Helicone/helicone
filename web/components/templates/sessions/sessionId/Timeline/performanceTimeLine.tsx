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

export default function PerformanceTimeline({
  data,
}: PerformanceTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<TimelineItem | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
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

  // Calculate the total width needed for the timeline
  // We'll use a fixed width per millisecond to ensure consistent scaling
  const pixelsPerMs = 0.5; // Adjust this value to change the zoom level
  const totalTimelineWidth = timeSpan * pixelsPerMs;

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

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        containerWidthRef.current = width;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Draw the timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions - now using the calculated total width
    const dpr = window.devicePixelRatio || 1;
    const height = 200;
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
    const markerInterval = 200; // ms between markers
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

      // Draw vertical grid line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw time label
      ctx.fillText(`${time} ms`, x + 5, markerY);
    });

    // Draw timeline items
    const barHeight = 16;
    const barSpacing = 8;
    let currentY = 50;

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
        const startX = (item.startTime - minTime) * pixelsPerMs;
        const endX = (item.endTime - minTime) * pixelsPerMs;
        const width = endX - startX;

        // Draw bar
        ctx.fillStyle =
          hoveredItem?.id === item.id || hoveredSection === item.section
            ? lightenColor(sectionColor, 0.2)
            : sectionColor;

        ctx.beginPath();
        ctx.roundRect(startX, currentY, width, barHeight, 4);
        ctx.fill();

        // Draw status indicator if applicable
        if (item.status === "error") {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(endX - 8, currentY + barHeight / 2, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px Inter, system-ui, sans-serif";
          ctx.fillText("×", endX - 10.5, currentY + barHeight / 2 + 3);
        }

        // Draw label if there's enough space
        if (width > 80 && item.label) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "11px Inter, system-ui, sans-serif";
          ctx.fillText(item.label, startX + 6, currentY + barHeight / 2 + 4);
        }

        currentY += barHeight + barSpacing;
      });

      // Add extra spacing between sections
      currentY += 10;
    });
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
    pixelsPerMs,
  ]);

  // Function to update the minimap - separated to avoid dependency issues
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
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, 150, 80);

    // Draw border
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 150, 80);

    // Draw timeline items in minimap
    const barHeight = 4;
    const barSpacing = 2;
    let currentY = 10;

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
        const startX = ((item.startTime - minTime) / timeSpan) * 150;
        const endX = ((item.endTime - minTime) / timeSpan) * 150;
        const width = endX - startX;

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
    if (scrollContainer && canvasWidthRef.current > 0) {
      const scrollLeft = scrollPositionRef.current;
      const visibleWidth = containerWidthRef.current;

      const visibleStartRatio = scrollLeft / canvasWidthRef.current;
      const visibleEndRatio = Math.min(
        1,
        (scrollLeft + visibleWidth) / canvasWidthRef.current
      );

      const visibleStartX = visibleStartRatio * 150;
      const visibleEndX = visibleEndRatio * 150;
      const visibleWidth150 = visibleEndX - visibleStartX;

      // Draw semi-transparent overlay for areas outside viewport
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillRect(0, 0, visibleStartX, 80);
      ctx.fillRect(visibleEndX, 0, 150 - visibleEndX, 80);

      // Draw viewport borders
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(visibleStartX, 0, visibleWidth150, 80);

      // Draw handle
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(visibleEndX, 70, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw handle border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Update handle position for dragging (using ref instead of state)
      minimapHandlePositionRef.current = { x: visibleEndX, y: 70 };
    }
  }, [minTime, maxTime, timeSpan, items, sections, colors]);

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

      // Calculate time from x position
      const time = minTime + x / pixelsPerMs;

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
          const startX = (item.startTime - minTime) * pixelsPerMs;
          const endX = (item.endTime - minTime) * pixelsPerMs;

          if (
            x >= startX &&
            x <= endX &&
            y >= currentY &&
            y <= currentY + barHeight
          ) {
            foundItem = item;
            foundSection = section.id;
            setTooltipPosition({
              x: e.clientX,
              y: e.clientY,
            });
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
  }, [minTime, items, sections, pixelsPerMs]);

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

  // Helper function to lighten a color
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
          style={{ height: "200px" }}
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

        {/* Minimap in bottom right corner */}
        <div className="absolute bottom-4 right-4 z-10">
          <canvas
            ref={minimapRef}
            className="w-[150px] h-[80px] cursor-pointer shadow-lg rounded-md"
            style={{
              cursor: isDraggingMinimap ? "grabbing" : "grab",
            }}
          />
        </div>

        {showTooltip && hoveredItem && (
          <div
            className="absolute z-20 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y + 10}px`,
              transform: "translate(-50%, 0)",
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

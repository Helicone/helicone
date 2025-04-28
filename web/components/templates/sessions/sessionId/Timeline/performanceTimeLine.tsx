"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TimelineItem, TimelineSection } from "../lib/types";
import TimelineTable from "./timelineTable";

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
  const [hoveredItem, setHoveredItem] = useState<TimelineItem | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [viewportRange, setViewportRange] = useState<[number, number]>(
    data.timeRange
  );
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [minimapHandlePosition, setMinimapHandlePosition] = useState({
    x: 0,
    y: 0,
  });

  const { timeRange, items, sections } = data;
  const [minTime, maxTime] = timeRange;
  const timeSpan = maxTime - minTime;
  const viewportTimeSpan = viewportRange[1] - viewportRange[0];

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

  // Draw the timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr; // Fixed height for the timeline
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = "200px";
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw time markers
    const timeMarkers = [200, 400, 600, 800, 1000, 2000, 2200, 2400];
    const markerY = 20;

    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    timeMarkers.forEach((time) => {
      // Only draw markers that are within the viewport
      if (time >= viewportRange[0] && time <= viewportRange[1]) {
        const x = ((time - viewportRange[0]) / viewportTimeSpan) * rect.width;

        // Draw vertical grid line
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height / dpr);
        ctx.stroke();

        // Draw time label
        ctx.fillText(`${time} ms`, x + 5, markerY);
      }
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
        // Only draw items that are at least partially within the viewport
        if (
          item.endTime >= viewportRange[0] &&
          item.startTime <= viewportRange[1]
        ) {
          const visibleStartTime = Math.max(item.startTime, viewportRange[0]);
          const visibleEndTime = Math.min(item.endTime, viewportRange[1]);

          const startX =
            ((visibleStartTime - viewportRange[0]) / viewportTimeSpan) *
            rect.width;
          const endX =
            ((visibleEndTime - viewportRange[0]) / viewportTimeSpan) *
            rect.width;
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
    viewportRange,
    viewportTimeSpan,
  ]);

  // Draw the minimap
  useEffect(() => {
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

    // Draw viewport indicator
    const viewportStartX = ((viewportRange[0] - minTime) / timeSpan) * 150;
    const viewportEndX = ((viewportRange[1] - minTime) / timeSpan) * 150;
    const viewportWidth = viewportEndX - viewportStartX;

    // Draw semi-transparent overlay for areas outside viewport
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(0, 0, viewportStartX, 80);
    ctx.fillRect(viewportEndX, 0, 150 - viewportEndX, 80);

    // Draw viewport borders
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(viewportStartX, 0, viewportWidth, 80);

    // Draw handle
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(viewportEndX, 70, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw handle border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // IMPORTANT: We're calculating the handle position here but NOT updating state
    // This prevents the infinite update loop
  }, [minTime, maxTime, timeSpan, items, sections, colors, viewportRange]);

  // Add a separate useEffect to update the minimapHandlePosition only when viewportRange changes
  useEffect(() => {
    // Calculate handle position based on viewport
    const viewportEndX = ((viewportRange[1] - minTime) / timeSpan) * 150;
    setMinimapHandlePosition({ x: viewportEndX, y: 70 });
  }, [viewportRange, minTime, timeSpan]);

  // Update the mouse interaction useEffect to use the latest minimapHandlePosition
  // without adding it to the dependency array:
  useEffect(() => {
    const minimap = minimapRef.current;
    if (!minimap) return;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = minimap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Get the current handle position (don't use state directly to avoid dependency)
      const handleX = ((viewportRange[1] - minTime) / timeSpan) * 150;
      const handleY = 70;

      // Check if clicking on the handle
      const distance = Math.sqrt(
        Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2)
      );

      if (distance <= 12) {
        setIsDraggingMinimap(true);
      } else {
        // Check if clicking on the minimap area
        if (x >= 0 && x <= 150 && y >= 0 && y <= 80) {
          // Calculate new viewport center
          const clickedTime = minTime + (x / 150) * timeSpan;
          const halfViewportSpan = viewportTimeSpan / 2;

          // Set new viewport range centered on click position
          setViewportRange([
            Math.max(minTime, clickedTime - halfViewportSpan),
            Math.min(maxTime, clickedTime + halfViewportSpan),
          ]);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMinimap) {
        const rect = minimap.getBoundingClientRect();
        const x = Math.max(0, Math.min(150, e.clientX - rect.left));

        // Calculate new time based on drag position
        const newTime = minTime + (x / 150) * timeSpan;

        // Calculate how much to move the viewport
        const currentViewportWidth = viewportRange[1] - viewportRange[0];

        // Set new viewport range
        const newStart = viewportRange[0];
        let newEnd = newTime;

        // Ensure viewport width stays consistent
        if (newEnd < newStart + currentViewportWidth * 0.2) {
          newEnd = newStart + currentViewportWidth * 0.2;
        }

        // Ensure we don't go beyond the max time
        if (newEnd > maxTime) {
          newEnd = maxTime;
        }

        setViewportRange([newStart, newEnd]);
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
  }, [
    isDraggingMinimap,
    minTime,
    maxTime,
    timeSpan,
    viewportRange,
    viewportTimeSpan,
  ]);

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
        <canvas ref={canvasRef} className="w-full cursor-pointer" />

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

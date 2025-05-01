import { useCallback, useEffect, useRef } from "react";
import { TimelineItem, TimelineSection } from "../lib/types";

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
  MINIMUM_BAR_WIDTH: 2,
} as const;

const MINIMAP_CONSTANTS = {
  WIDTH: 150,
  HEIGHT: 80,
  PADDING: 8,
  BAR_HEIGHT: 2, // Make minimap bars smaller
  BAR_SPACING: 1, // Tighter spacing in minimap
} as const;
/*

*/
export default function PerformanceTimelineV2({
  data,
  onItemClick,
}: PerformanceTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null); // Outer container to get the dimensions
  const ratio = (canvasRef.current?.width || 0) / data.timeRange[1];
  const cursorRef = useRef({ x: 0, y: 0 });
  const zoomFactor = useRef(1);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    cursorRef.current = {
      x: e.clientX - (rect?.left || 0),
      y: e.clientY - (rect?.top || 0),
    };
    console.log(cursorRef.current);
  }, []);

  const handleZoom = useCallback((e: WheelEvent) => {
    const direction = e.detail < 0 || e.deltaY < 0 ? 1 : -1;
    const factor = Math.pow(1.1, direction);
    zoomFactor.current *= factor;
    zoomFactor.current = Math.max(0.1, zoomFactor.current);
    zoomFactor.current = Math.min(10, zoomFactor.current);

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      console.log("here");
      ctx.clearRect(
        0,
        0,
        canvasRef.current?.width || 0,
        canvasRef.current?.height || 0
      );
      ctx.translate(cursorRef.current.x, cursorRef.current.y);
      ctx.scale(zoomFactor.current, zoomFactor.current);
      ctx.translate(-cursorRef.current.x, -cursorRef.current.y);

      drawTimelineItems(ctx, data.items, ratio);
    }
  }, []);

  // event listener for mouse tracking
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      canvasRef.current?.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // event listener for zooming
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener("wheel", handleZoom);
    }
    return () => {
      canvasRef.current?.removeEventListener("wheel", handleZoom);
    };
  }, [handleZoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (canvas && container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");

    if (ctx) {
      drawTimelineItems(ctx, data.items, ratio);
    }
  }, [data.items, ratio]);

  return (
    <div
      ref={containerRef}
      className="relative border border-gray-200 rounded-lg overflow-hidden bg-white h-[300px] w-full"
    >
      <canvas ref={canvasRef} className="border border-gray-300" />
    </div>
  );
}

const drawTimelineItems = (
  context: CanvasRenderingContext2D,
  items: TimelineItem[],
  pixelRatio: number
) => {
  let sectionYHeight = TIMELINE_CONSTANTS.INITIAL_Y;

  items.forEach((item: TimelineItem) => {
    // Draw the actual bar
    const itemWidth = Math.max(
      TIMELINE_CONSTANTS.MINIMUM_BAR_WIDTH,
      (item.endTime - item.startTime) * pixelRatio
    );
    context.beginPath();
    context.fillStyle = "#ef4444";
    context.roundRect(
      item.startTime * pixelRatio,
      sectionYHeight,
      itemWidth,
      TIMELINE_CONSTANTS.BAR_HEIGHT,
      3
    );
    context.fill();
    sectionYHeight += TIMELINE_CONSTANTS.BAR_HEIGHT;
  });
};

import { Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock4Icon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PiSplitHorizontalBold } from "react-icons/pi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Tooltip as RechartsTooltip,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Session, Trace } from "../../../../lib/sessions/sessionTypes";
import { Col } from "../../../layout/common/col";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { useColorMapStore } from "@/store/features/sessions/colorMap";

const ROUNDED_RADIUS = 1;
const BAR_SIZE = 25; // Increased from 30 to 50
interface BarChartTrace {
  name: string;
  path: string;
  start: number;
  duration: number;
  trace: Trace;
  request_id: string;
}

export const TraceSpan = ({
  session,
  selectedRequestIdDispatch,
  isOriginalRealtime,
  onHighlighterChange,
  drawerRef,
}: {
  session: Session;
  selectedRequestIdDispatch: [string, (x: string) => void];
  isOriginalRealtime?: boolean;
  drawerRef: MutableRefObject<any>;
  onHighlighterChange?: (
    start: number | null,
    end: number | null,
    active: boolean
  ) => void;
}) => {
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;
  const { theme } = useTheme();
  const { getColor } = useColorMapStore();
  const [drawerSize] = useLocalStorage("session-request-drawer-size", 0);

  // Highlighter state
  const [highlighterActive, setHighlighterActive] = useState(false);
  const [highlighterStart, setHighlighterStart] = useState<number | null>(null);
  const [highlighterEnd, setHighlighterEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragEdge, setDragEdge] = useState<"start" | "end" | "middle" | null>(
    null
  );
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [initialDragMovement, setInitialDragMovement] = useState(false);

  const spanData: BarChartTrace[] = useMemo(() => {
    if (!session || !session.traces) return [];
    const startTimeMs = session.start_time_unix_timestamp_ms;
    if (startTimeMs === undefined || startTimeMs === null || isNaN(startTimeMs))
      return [];

    return session.traces.map((trace: Trace, index: number): BarChartTrace => {
      const startMs = trace.start_unix_timestamp_ms;
      const endMs = trace.end_unix_timestamp_ms;

      if (
        typeof startMs !== "number" ||
        isNaN(startMs) ||
        typeof endMs !== "number" ||
        isNaN(endMs)
      ) {
        console.warn("Invalid trace timestamps found for trace:", trace);
        // Return a valid BarChartTrace object even for invalid data
        return {
          name: `Invalid ${index + 1}`,
          path: trace.path ?? "invalid",
          start: 0,
          duration: 0,
          trace: trace, // Keep the original trace for potential debugging
          request_id: trace.request_id ?? `invalid-${index}`,
        };
      }

      const start = (startMs - startTimeMs) / 1000;
      const duration = (endMs - startMs) / 1000;

      let name: string | number = `${trace.path.split("/").pop() ?? "Trace"}`;
      if (isOriginalRealtime) {
        const role =
          trace.request.heliconeMetadata?.customProperties
            ?._helicone_realtime_step_role;
        name = role ? `${role} ${index + 1}` : `Step ${index + 1}`;
      }

      return {
        name: `${name}`,
        path: trace.path ?? "",
        start: Math.max(0, start),
        duration: Math.max(0.01, duration),
        trace: trace,
        request_id: trace.request_id,
      };
    });
  }, [session, isOriginalRealtime]);

  const domain = useMemo(() => {
    if (spanData.length === 0) return [0, 1]; // Default domain if no data
    const lastItem = spanData[spanData.length - 1];
    const maxEnd = (lastItem?.start ?? 0) + (lastItem?.duration ?? 0);
    return [0, Math.max(1, maxEnd)]; // Ensure domain is at least 1s
  }, [spanData]);

  // Track the last valid chart dimensions for consistent calculations
  const [lastChartDimensions, setLastChartDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // We only need one coordinate conversion helper since we're using direct ratio for movement
  const pixelToDomain = useCallback(
    (pixelX: number, chartWidth: number) => {
      const domainWidth = domain[1] - domain[0];
      const ratio = domainWidth / chartWidth;
      return domain[0] + pixelX * ratio;
    },
    [domain]
  );

  // Initialize highlighter position when data is loaded
  useEffect(() => {
    if (
      spanData.length > 0 &&
      domain[1] > domain[0] &&
      highlighterStart === null
    ) {
      // Set initial highlighter to cover middle 30% of the domain
      const totalDuration = domain[1] - domain[0];
      const startPos = domain[0] + totalDuration * 0.35;
      const endPos = domain[0] + totalDuration * 0.65;

      setHighlighterStart(startPos);
      setHighlighterEnd(endPos);
    }
  }, [spanData, highlighterStart, domain]);

  // Update selected requests based on highlighter position
  useEffect(() => {
    if (
      !highlighterActive ||
      highlighterStart === null ||
      highlighterEnd === null
    )
      return;

    // Find indices that fall within the time range of the highlighter
    const selectedIndices = spanData
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        // Ensure we have valid numbers to prevent NaN errors
        if (
          typeof item.start !== "number" ||
          typeof item.duration !== "number"
        ) {
          return false;
        }

        const itemStart = item.start;
        const itemEnd = item.start + item.duration;

        // Check if the item overlaps with the highlighter range
        return itemStart <= highlighterEnd && itemEnd >= highlighterStart;
      })
      .map(({ index }) => index);

    // If no indices are selected, don't update anything
    if (selectedIndices.length === 0) return;

    // Notify parent component about highlighter changes immediately
    if (onHighlighterChange) {
      const minIndex = Math.min(...selectedIndices);
      const maxIndex = Math.max(...selectedIndices);
      onHighlighterChange(minIndex, maxIndex, highlighterActive);
    }

    // Get all request IDs within the highlighter range
    const selectedRequestIds = spanData
      .filter((_, index) => selectedIndices.includes(index))
      .map((item) => item.request_id);

    // Update the selected request ID
    if (selectedRequestIds.length > 0) {
      // Set the first request ID in the range
      setSelectedRequestId(selectedRequestIds[0]);
    }
  }, [
    highlighterActive,
    highlighterStart,
    highlighterEnd,
    spanData,
    onHighlighterChange,
    setSelectedRequestId,
  ]);

  // Helper function to update chart dimensions consistently
  const updateChartDimensions = useCallback(
    (e: any) => {
      if (
        e.width &&
        e.height &&
        (!lastChartDimensions ||
          lastChartDimensions.width !== e.width ||
          lastChartDimensions.height !== e.height)
      ) {
        setLastChartDimensions({ width: e.width, height: e.height });
      }
    },
    [lastChartDimensions]
  );

  // Handle mouse move for dragging the highlighter
  const handleMouseMove = useCallback(
    (e: any) => {
      if (
        !isDragging ||
        !highlighterActive ||
        highlighterStart === null ||
        highlighterEnd === null ||
        dragEdge === null ||
        dragStartX === null
      )
        return;

      // Ensure we have a valid chartX value
      const chartX = e.chartX;
      if (typeof chartX !== "number") return;

      // Consistently track chart dimensions
      const chartWidth = e.width || lastChartDimensions?.width || 1000;
      updateChartDimensions(e);

      const deltaX = chartX - dragStartX;

      // Skip tiny movements to reduce jitter
      if (Math.abs(deltaX) < 2) return;

      // Mark that we've had initial movement
      if (!initialDragMovement) {
        setInitialDragMovement(true);
      }

      // Direct ratio calculation for movement - simpler and more accurate
      const domainWidth = domain[1] - domain[0];
      const domainDeltaX = (deltaX / chartWidth) * domainWidth;

      // Don't update highlighter during initial movement
      if (!initialDragMovement) {
        setDragStartX(chartX);
        return;
      }

      let newStart = highlighterStart;
      let newEnd = highlighterEnd;
      const minSize = domainWidth * 0.1; // Minimum size is 10% of total timeline

      if (dragEdge === "start") {
        // Dragging left edge
        newStart = Math.max(
          domain[0],
          Math.min(highlighterEnd - minSize, highlighterStart + domainDeltaX)
        );
      } else if (dragEdge === "end") {
        // Dragging right edge
        newEnd = Math.min(
          domain[1],
          Math.max(highlighterStart + minSize, highlighterEnd + domainDeltaX)
        );
      } else if (dragEdge === "middle") {
        // Dragging the entire highlighter
        const highlighterWidth = highlighterEnd - highlighterStart;

        // Ensure we don't drag beyond domain boundaries
        let newStartPos = highlighterStart + domainDeltaX;
        let newEndPos = highlighterEnd + domainDeltaX;

        if (newStartPos < domain[0]) {
          newStart = domain[0];
          newEnd = domain[0] + highlighterWidth;
        } else if (newEndPos > domain[1]) {
          newEnd = domain[1];
          newStart = domain[1] - highlighterWidth;
        } else {
          newStart = newStartPos;
          newEnd = newEndPos;
        }
      }

      // Update the highlighter position
      setHighlighterStart(newStart);
      setHighlighterEnd(newEnd);

      // Always update dragStartX to prevent accumulation of small movements
      setDragStartX(chartX);

      // Prevent default behavior and stop propagation
      e.preventDefault?.();
      e.stopPropagation?.();
    },
    [
      isDragging,
      highlighterActive,
      highlighterStart,
      highlighterEnd,
      dragEdge,
      dragStartX,
      domain,
      lastChartDimensions,
      initialDragMovement,
      updateChartDimensions,
    ]
  );

  // Handle mouse down on the chart for dragging the highlighter
  const handleMouseDown = useCallback(
    (e: any) => {
      if (
        !highlighterActive ||
        highlighterStart === null ||
        highlighterEnd === null
      )
        return;

      // Get the chart's domain coordinates
      const chartX = e.chartX;
      if (typeof chartX !== "number") return;

      const chartWidth = e.width || lastChartDimensions?.width || 1000;
      updateChartDimensions(e);

      // Calculate the x position in domain units
      const xDomain = pixelToDomain(chartX, chartWidth);

      // Determine which part we're dragging with a threshold of 5% of domain width
      const domainWidth = domain[1] - domain[0];
      const edgeThreshold = domainWidth * 0.05;

      // Prepare for drag operation
      const startDrag = (edge: "start" | "end" | "middle") => {
        setDragEdge(edge);
        setIsDragging(true);
        setInitialDragMovement(false);
        setDragStartX(chartX);
        e.stopPropagation?.();
        e.preventDefault?.();
      };

      if (Math.abs(xDomain - highlighterStart) <= edgeThreshold) {
        startDrag("start"); // Dragging left edge
      } else if (Math.abs(xDomain - highlighterEnd) <= edgeThreshold) {
        startDrag("end"); // Dragging right edge
      } else if (xDomain > highlighterStart && xDomain < highlighterEnd) {
        startDrag("middle"); // Dragging middle
      }
      // If clicked outside, pass through to normal click handlers
    },
    [
      highlighterActive,
      highlighterStart,
      highlighterEnd,
      domain,
      pixelToDomain,
      lastChartDimensions,
      updateChartDimensions,
    ]
  );

  // Unified mouse handler for reference areas
  const handleReferenceMouseDown = useCallback(
    (e: any, edge: "start" | "end" | "middle") => {
      if (!highlighterActive) return;

      e.preventDefault?.();
      e.stopPropagation?.();

      setDragEdge(edge);
      setIsDragging(true);
      setInitialDragMovement(false);

      // Get the most reliable X coordinate
      const eventX =
        e.chartX ||
        (e.nativeEvent && "chartX" in e.nativeEvent
          ? e.nativeEvent.chartX
          : null) ||
        (e.nativeEvent && "clientX" in e.nativeEvent
          ? e.nativeEvent.clientX
          : 0);

      updateChartDimensions(e);
      setDragStartX(eventX);
    },
    [highlighterActive, updateChartDimensions]
  );

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Only reset if we were actually dragging
      setIsDragging(false);
      setDragEdge(null);
      setDragStartX(null);
      setInitialDragMovement(false);
    }
  }, [isDragging]);

  // Add global mouse up handler to ensure drag ends even if mouse leaves the chart
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setDragEdge(null);
        setDragStartX(null);
        setInitialDragMovement(false);
      };
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => {
        window.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  // Toggle highlighter active state
  const toggleHighlighter = () => {
    const newActiveState = !highlighterActive;
    setHighlighterActive(newActiveState);

    // If activating and no position set, initialize it
    if (
      newActiveState &&
      (highlighterStart === null || highlighterEnd === null) &&
      domain[1] > domain[0]
    ) {
      const totalDuration = domain[1] - domain[0];
      setHighlighterStart(domain[0] + totalDuration * 0.35);
      setHighlighterEnd(domain[0] + totalDuration * 0.65);
    }

    // When disabling, notify parent to clear the highlighter
    if (!newActiveState && onHighlighterChange) {
      onHighlighterChange(null, null, false);
    }
  };

  // Handle bar click - modified to not trigger if we're dragging
  const handleBarClick = (data: any) => {
    // Don't handle clicks when highlighter is active or if we were just dragging
    if (highlighterActive || isDragging) return;

    const clickedData = data.activePayload?.[0]?.payload as BarChartTrace;
    if (!clickedData) return;

    // Set the request ID
    setSelectedRequestId(clickedData.request_id);
    openDrawer(drawerRef, drawerSize);

    // Notify parent about the selected message range
    if (onHighlighterChange) {
      // For a single message click, set the range to just this message's index
      const messageIndex = spanData.findIndex(
        (item) => item.request_id === clickedData.request_id
      );
      if (messageIndex !== -1) {
        // Set both start and end to the same index to indicate a single message
        onHighlighterChange(messageIndex, messageIndex, false);
      }
    }
  };

  return (
    <div
      className="relative h-full flex flex-col select-none"
      id="sessions-trace-span"
    >
      <ScrollArea>
        <ResponsiveContainer
          width="100%"
          height={Math.max(300, spanData.length * BAR_SIZE)}
        >
          <BarChart
            data={spanData}
            layout="vertical"
            barSize={BAR_SIZE}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onClick={handleBarClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === "dark" ? "#475569" : "#ccc"}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, color: "#64748b" }}
              domain={domain}
              label={{
                value: "Duration (s)",
                position: "insideBottomLeft",
                offset: 10,
              }}
              tickCount={10}
              hide={true} // Hide X Labels
            />
            <YAxis
              dataKey="name"
              type="category"
              interval={0}
              tick={{ fontSize: 12, className: "hidden" }}
              hide={true}
              width={100}
              ticks={[]}
              label={{
                value: "Trace Path",
                angle: -90,
                position: "insideLeft",
                offset: -5,
              }}
              domain={[0, spanData.length]}
            />
            <RechartsTooltip
              cursor={{
                fill: highlighterActive
                  ? "transparent"
                  : theme === "dark"
                  ? "#020617" // slate-950
                  : "#f8fafc", // slate-50
              }}
              content={(props) => {
                const { payload } = props;
                if (highlighterActive) return null;

                const traceData: BarChartTrace | undefined =
                  payload?.[0]?.payload;
                if (!traceData || !traceData.trace) return null;

                // Access data directly from the trace object
                const createdAt = traceData.trace.start_unix_timestamp_ms;
                const duration = traceData.duration;

                return (
                  <Col className="gap-2 rounded glass border border-slate-200 dark:border-slate-800 z-50 p-2">
                    <Row className="justify-between">
                      <Row className="gap-2 items-center">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {traceData?.name}
                        </h3>
                      </Row>
                      <Row className="gap-1 items-center">
                        <Clock4Icon
                          width={16}
                          height={16}
                          className="text-slate-500 dark:text-slate-400"
                        />
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          {duration?.toFixed(2)}s
                        </p>
                      </Row>
                    </Row>
                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      <span className="font-semibold">Start:</span>{" "}
                      {typeof createdAt === "number"
                        ? new Date(createdAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </Col>
                );
              }}
              active={!highlighterActive}
            />
            <Bar
              dataKey="start"
              stackId="a"
              fill="rgba(0,0,0,0)"
              isAnimationActive={false}
              radius={[
                ROUNDED_RADIUS,
                ROUNDED_RADIUS,
                ROUNDED_RADIUS,
                ROUNDED_RADIUS,
              ]} // Rounded corners
            >
              {spanData.map((entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
            <Bar
              dataKey="duration"
              stackId="a"
              isAnimationActive={false}
              radius={[
                ROUNDED_RADIUS,
                ROUNDED_RADIUS,
                ROUNDED_RADIUS,
                ROUNDED_RADIUS,
              ]} // Rounded corners
            >
              <LabelList
                dataKey="name"
                position="insideLeft"
                content={(props) => {
                  const { x, y, height, value, index } = props;
                  if (index === undefined || !spanData[index]) return null;
                  const entry = spanData[index];

                  // Determine if this bar is selected based on highlighter or individual selection
                  const isInHighlighter =
                    highlighterActive &&
                    highlighterStart !== null &&
                    highlighterEnd !== null &&
                    entry.start <= highlighterEnd &&
                    entry.start + entry.duration >= highlighterStart;

                  const isIndividuallySelected =
                    !highlighterActive &&
                    entry.request_id === selectedRequestId;

                  const isSelected = isInHighlighter || isIndividuallySelected;

                  return (
                    <text
                      x={typeof x === "number" ? x + 5 : x}
                      y={
                        typeof height === "number" && typeof y === "number" && y
                          ? y + height / 2
                          : y
                      }
                      className={
                        isSelected
                          ? theme === "dark"
                            ? "fill-sky-500"
                            : "fill-sky-700"
                          : "fill-card-foreground"
                      }
                      opacity={isSelected ? 1 : 0.7}
                      textAnchor="start"
                      dominantBaseline="central"
                      style={{
                        fontSize: "12px",
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                      onClick={() => {
                        if (highlighterActive) return;
                        setSelectedRequestId(entry.request_id);
                        // Notify parent about the selected message range
                        if (onHighlighterChange && index !== undefined) {
                          onHighlighterChange(index, index, false);
                        }
                      }}
                    >
                      {value}
                    </text>
                  );
                }}
              />
              {spanData.map((entry, index) => {
                const color = getColor(entry.path);
                // Determine if this bar is in the highlighter range

                return (
                  <Cell
                    key={`colored-cell-${index}`}
                    className="cursor-pointer transition-colors duration-150"
                    style={{ fill: color }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.fill = `${color}80`; // 50% opacity (approx.)
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.fill = color;
                    }}
                    strokeWidth={2}
                    stroke={color}
                    onClick={() => {
                      if (highlighterActive) return;
                      setSelectedRequestId(entry.request_id);
                      if (onHighlighterChange) {
                        onHighlighterChange(index, index, false);
                      }
                    }}
                  />
                );
              })}
            </Bar>

            {/* Highlighter Reference Area */}
            {highlighterActive &&
              highlighterStart !== null &&
              highlighterEnd !== null && (
                <ReferenceArea
                  x1={highlighterStart}
                  x2={highlighterEnd}
                  y1={0}
                  y2={spanData.length - 1}
                  fill={
                    theme === "dark"
                      ? "rgba(14, 165, 233, 0.2)"
                      : "rgba(14, 165, 233, 0.15)"
                  }
                  stroke={theme === "dark" ? "#0ea5e9" : "#0369a1"}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  className={`${
                    isDragging && dragEdge === "middle"
                      ? "cursor-grabbing"
                      : "cursor-grab"
                  } transition-colors duration-150`}
                  onMouseDown={(e) => handleReferenceMouseDown(e, "middle")}
                />
              )}

            {/* Highlighter edge handles - make them wider for easier grabbing */}
            {highlighterActive &&
              highlighterStart !== null &&
              highlighterEnd !== null && (
                <>
                  {/* Left edge handle */}
                  <ReferenceArea
                    x1={Math.max(
                      domain[0],
                      highlighterStart - (domain[1] - domain[0]) * 0.02
                    )}
                    x2={highlighterStart + (domain[1] - domain[0]) * 0.02}
                    y1={0}
                    y2={spanData.length - 1}
                    fill={theme === "dark" ? "#0ea5e9" : "#0369a1"}
                    fillOpacity={0.5}
                    className="cursor-col-resize transition-opacity duration-150 hover:opacity-80"
                    onMouseDown={(e) => handleReferenceMouseDown(e, "start")}
                  />
                  {/* Right edge handle */}
                  <ReferenceArea
                    x1={highlighterEnd - (domain[1] - domain[0]) * 0.02}
                    x2={Math.min(
                      domain[1],
                      highlighterEnd + (domain[1] - domain[0]) * 0.02
                    )}
                    y1={0}
                    y2={spanData.length - 1}
                    fill={theme === "dark" ? "#0ea5e9" : "#0369a1"}
                    fillOpacity={0.5}
                    className="cursor-col-resize transition-opacity duration-150 hover:opacity-80"
                    onMouseDown={(e) => handleReferenceMouseDown(e, "end")}
                  />
                </>
              )}
          </BarChart>
        </ResponsiveContainer>
      </ScrollArea>
      <ResponsiveContainer width="100%" height={52}>
        <BarChart
          data={spanData}
          layout="vertical"
          barSize={30} // Increased bar size
          margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            domain={domain}
            label={{
              value: "Duration (s)",
              position: "insideBottomLeft",
              offset: 10,
              style: { textAnchor: "start" },
            }}
            orientation="top"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Highlighter Controls */}
      {isOriginalRealtime && (
        <Button
          variant={highlighterActive ? "default" : "glass"}
          size="sm"
          onClick={toggleHighlighter}
          className="absolute top-4 right-4 gap-2"
        >
          <PiSplitHorizontalBold
            size={18}
            className={`transition-colors ${
              highlighterActive ? "animate-pulse text-sky-400" : ""
            }`}
          />
          {highlighterActive ? "Disable Highlighter" : "Enable Highlighter"}
        </Button>
      )}
    </div>
  );
};

function openDrawer(drawerRef: MutableRefObject<any>, drawerSize: number) {
  drawerRef.current?.expand();
  if (drawerSize === 0) {
    drawerRef.current?.resize(33);
  } else {
    drawerRef.current?.resize(drawerSize);
  }
}

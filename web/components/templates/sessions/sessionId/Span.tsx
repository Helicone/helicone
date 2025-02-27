import { Row } from "@/components/layout/common";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock4Icon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HeliconeRequest } from "../../../../lib/api/request/request";
import { Session, Trace } from "../../../../lib/sessions/sessionTypes";
import { Col } from "../../../layout/common/col";
import { clsx } from "../../../shared/clsx";

interface BarChartTrace {
  name: string;
  path: string;
  start: number;
  duration: number;
  trace: Trace | HeliconeRequest;
  request_id: string;
  turn_index?: number; // Add turn index for realtime sessions
}

export const TraceSpan = ({
  session,
  selectedRequestIdDispatch,
  height,
  realtimeData,
  selectedTurnIndexDispatch,
}: {
  session: Session;
  selectedRequestIdDispatch: [string, (x: string) => void];
  height?: string;
  realtimeData?: {
    isRealtime: boolean;
    effectiveRequests: HeliconeRequest[];
    originalRequest: HeliconeRequest | null;
  };
  selectedTurnIndexDispatch?: [number | null, (x: number | null) => void];
}) => {
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;
  const selectedTurnState = selectedTurnIndexDispatch || [null, () => {}];
  const [selectedTurnIndex, setSelectedTurnIndex] = selectedTurnState;
  const { theme } = useTheme();

  // Extract values from realtimeData or use defaults
  const isRealtime = realtimeData?.isRealtime || false;
  const effectiveRequests = realtimeData?.effectiveRequests || [];

  const spanData: BarChartTrace[] = isRealtime
    ? // For realtime sessions, create span data from timestamps in the requests
      effectiveRequests.map((request, index) => {
        const timestamp = new Date(request.request_created_at).getTime();
        const startTimeMs = session.start_time_unix_timestamp_ms;

        // For visualization purposes, space out the requests slightly
        const start = (timestamp - startTimeMs) / 1000;

        // Use a fixed duration for visualization purposes
        // In a real realtime session, messages come quickly one after another
        const duration = 0.5; // 0.5 seconds

        // Find turn index for this request based on role
        const role = request.properties._helicone_realtime_role;

        // Extract turn index from request id if available (format: originalId-timestamp-turnIndex)
        const requestIdParts = request.request_id.split("-");
        const turnIndex =
          // First try to get it from properties
          request.properties._helicone_realtime_turn_index
            ? parseInt(request.properties._helicone_realtime_turn_index)
            : // Then try to extract from request ID (format: originalId-timestamp-turnIndex)
            requestIdParts.length > 2 &&
              !isNaN(parseInt(requestIdParts[requestIdParts.length - 1]))
            ? parseInt(requestIdParts[requestIdParts.length - 1])
            : // Fallback to calculating based on role changes
              effectiveRequests
                .slice(0, index)
                .filter((r) => r.properties._helicone_realtime_role !== role)
                .length;

        return {
          name:
            request.properties._helicone_realtime_role ||
            `Message ${index + 1}`,
          path:
            request.request_path ||
            request.properties._helicone_realtime_role ||
            "message",
          start,
          duration,
          trace: request,
          request_id: request.request_id,
          turn_index: turnIndex,
        };
      })
    : // For normal sessions, use the trace data
      session.traces.map((trace, index) => ({
        name: `${trace.path.split("/").pop() ?? ""}`,
        path: trace.path ?? "",
        start:
          (trace.start_unix_timestamp_ms -
            session.start_time_unix_timestamp_ms) /
          1000,
        duration:
          (trace.end_unix_timestamp_ms - trace.start_unix_timestamp_ms) / 1000,
        trace: trace,
        request_id: trace.request_id,
      }));

  const roundedRadius = 5;

  const domain = [
    0,
    (spanData?.[spanData.length - 1]?.duration ?? 0) +
      (spanData?.[spanData.length - 1]?.start ?? 0),
  ];

  const barSize = 35; // Increased from 30 to 50

  // Handle click on a bar in the chart
  const handleBarClick = (data: any) => {
    const clickedData = data.activePayload?.[0]?.payload as BarChartTrace;
    if (!clickedData) return;

    if (
      isRealtime &&
      selectedTurnIndexDispatch &&
      clickedData.turn_index !== undefined
    ) {
      // For realtime sessions, set the turn index directly without any conversions
      // and clear the request ID to ensure turn view is shown
      setSelectedTurnIndex(clickedData.turn_index);
      setSelectedRequestId(""); // Important: Clear request ID to ensure turn view is shown
    } else {
      // For regular sessions, just set the request ID
      setSelectedRequestId(clickedData.request_id);
    }
  };

  return (
    <div className="mx-1" id="sessions-trace-span">
      <ScrollArea style={{ height: height ?? "500px", overflowY: "auto" }}>
        {" "}
        {/* Increased from 350px to 500px */}
        <ResponsiveContainer width="100%" height={spanData.length * barSize}>
          <BarChart
            data={spanData}
            layout="vertical"
            barSize={barSize}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onClick={handleBarClick}
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
                position: "insideBottomRight",
                offset: -10,
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
            <Tooltip
              cursor={{
                fill: theme === "dark" ? "rgb(2, 6, 23)" : "rgb(248, 250, 252)",
              }}
              content={(props) => {
                const { payload } = props;

                const traceData: BarChartTrace = payload?.[0]?.payload;
                if (!traceData) return null;

                const createdAt = isRealtime
                  ? (traceData.trace as HeliconeRequest).request_created_at
                  : (traceData.trace as Trace).request.heliconeMetadata
                      .createdAt;

                return (
                  <Col className="bg-slate-50 dark:bg-slate-800 dark:p-2 gap-2 rounded border border-slate-200 dark:border-slate-700 z-50">
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
                          {traceData?.duration}s
                        </p>
                      </Row>
                    </Row>
                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      <span className="font-semibold">Start:</span>{" "}
                      {new Date(createdAt).toLocaleString()}
                    </p>
                    {isRealtime && traceData.turn_index !== undefined && (
                      <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Turn:</span>{" "}
                        {traceData.turn_index + 1} - {traceData.name}
                      </p>
                    )}
                  </Col>
                );
              }}
            />
            <Bar
              dataKey="start"
              stackId="a"
              fill="rgba(0,0,0,0)"
              isAnimationActive={false}
              radius={[
                roundedRadius,
                roundedRadius,
                roundedRadius,
                roundedRadius,
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
                roundedRadius,
                roundedRadius,
                roundedRadius,
                roundedRadius,
              ]} // Rounded corners
            >
              <LabelList
                dataKey="name"
                position="insideLeft"
                content={(props) => {
                  const { x, y, width, height, value, index } = props;
                  const entry = spanData[index ?? 0];

                  // Determine if this bar is selected based on request ID or turn index
                  const isSelected = isRealtime
                    ? selectedTurnIndex !== null &&
                      entry.turn_index === selectedTurnIndex
                    : entry.request_id === selectedRequestId;

                  return (
                    <text
                      x={typeof x === "number" ? x + 5 : x}
                      y={
                        typeof height === "number" && typeof y === "number" && y
                          ? y + height / 2
                          : y
                      }
                      fill={
                        isSelected
                          ? theme === "dark"
                            ? "#0ea5e9"
                            : "#0369A1"
                          : theme === "dark"
                          ? "#cbd5e1"
                          : "#334155"
                      }
                      opacity={isSelected ? 1 : 0.7}
                      textAnchor="start"
                      dominantBaseline="central"
                      style={{
                        fontSize: "12px",
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                      onClick={() =>
                        isRealtime && entry.turn_index !== undefined
                          ? (setSelectedTurnIndex(entry.turn_index),
                            setSelectedRequestId(""))
                          : setSelectedRequestId(entry.request_id)
                      }
                    >
                      {isRealtime && entry.turn_index !== undefined
                        ? `${value} (Turn ${entry.turn_index + 1})`
                        : value}
                    </text>
                  );
                }}
              />
              {spanData.map((entry, index) => (
                <Cell
                  key={`colored-cell-${index}`}
                  className={clsx(
                    (
                      isRealtime && selectedTurnIndex !== null
                        ? entry.turn_index === selectedTurnIndex
                        : entry.request_id === selectedRequestId
                    )
                      ? "fill-sky-200 hover:fill-sky-200/50 dark:fill-sky-700 dark:hover:fill-sky-700/50 hover:cursor-pointer"
                      : "fill-sky-100 hover:fill-sky-50 dark:fill-sky-800 dark:hover:fill-sky-800/50 hover:cursor-pointer"
                  )}
                  strokeWidth={1}
                  stroke={theme === "dark" ? "#0369a1" : "#bae6fd"}
                  onClick={() => {
                    if (isRealtime && entry.turn_index !== undefined) {
                      setSelectedTurnIndex(entry.turn_index);
                      setSelectedRequestId("");
                    } else {
                      setSelectedRequestId(entry.request_id);
                    }
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ScrollArea>
      <div className=" bottom-0 left-0">
        <ResponsiveContainer width="100%" height={80}>
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
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle" },
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

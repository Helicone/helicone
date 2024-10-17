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
import { Session, Trace } from "../../../../lib/sessions/sessionTypes";
import { Col } from "../../../layout/common/col";
import { clsx } from "../../../shared/clsx";
import { Row } from "@/components/layout/common";
import { Clock4Icon } from "lucide-react";
import { useTheme } from "next-themes";

interface BarChartTrace {
  name: string;
  path: string;
  start: number;
  duration: number;
  trace: Trace;
}
export const TraceSpan = ({
  session,
  selectedRequestIdDispatch,
  height,
}: {
  session: Session;
  selectedRequestIdDispatch: [string, (x: string) => void];
  height?: string;
}) => {
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;
  const spanData: BarChartTrace[] = session.traces.map((trace, index) => ({
    name: `${trace.path.split("/").pop() ?? ""}`,
    path: trace.path ?? "",
    start:
      (trace.start_unix_timestamp_ms - session.start_time_unix_timestamp_ms) /
      1000,
    duration:
      (trace.end_unix_timestamp_ms - trace.start_unix_timestamp_ms) / 1000,
    trace: trace,
  }));
  const roundedRadius = 5;

  const domain = [
    0,
    (spanData?.[spanData.length - 1]?.duration ?? 0) +
      (spanData?.[spanData.length - 1]?.start ?? 0),
  ];

  const barSize = 35; // Increased from 30 to 50

  const { theme } = useTheme();

  return (
    <div className="mx-1" id="sessions-trace-span">
      <div style={{ height: height ?? "500px", overflowY: "auto" }}>
        {" "}
        {/* Increased from 350px to 500px */}
        <ResponsiveContainer width="100%" height={spanData.length * barSize}>
          <BarChart
            data={spanData}
            layout="vertical"
            barSize={barSize}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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

                const trace: BarChartTrace = payload?.[0]?.payload;
                return (
                  <Col className="bg-slate-50 dark:p-2 gap-2 rounded border border-slate-200 z-50">
                    <Row className="justify-between">
                      <Row className="gap-2 items-center">
                        <h3 className="text-sm font-semibold text-slate-700">
                          {trace?.name}
                        </h3>
                        {/* <div
                          className={clsx(
                            "w-2 h-2 rounded-lg animate-pulse",
                            bgColor
                          )}
                        ></div> */}
                      </Row>
                      <Row className="gap-1 items-center">
                        <Clock4Icon
                          width={16}
                          height={16}
                          className="text-slate-500"
                        />
                        <p className="text-xs font-normal text-slate-500">
                          {trace?.duration}s
                        </p>
                      </Row>
                    </Row>
                    <p className="text-xs font-normal text-slate-500">
                      <span className="font-semibold">Start:</span>{" "}
                      {new Date(
                        trace?.trace.request.createdAt ?? 0
                      ).toLocaleString()}
                    </p>
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
                  const isSelected =
                    spanData[index ?? 0].trace.request_id === selectedRequestId;
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
                        setSelectedRequestId(
                          spanData[index ?? 0].trace?.request_id ?? ""
                        )
                      }
                    >
                      {value}
                    </text>
                  );
                }}
              />
              {spanData.map((entry, index) => (
                <Cell
                  key={`colored-cell-${index}`}
                  className={clsx(
                    entry.trace.request_id === selectedRequestId
                      ? "fill-sky-200 hover:fill-sky-200/50 dark:fill-sky-700 dark:hover:fill-sky-700/50 hover:cursor-pointer"
                      : "fill-sky-100 hover:fill-sky-50 dark:fill-sky-800 dark:hover:fill-sky-800/50 hover:cursor-pointer"
                  )}
                  strokeWidth={1}
                  stroke={theme === "dark" ? "#0369a1" : "#bae6fd"}
                  onClick={() => setSelectedRequestId(entry.trace.request_id)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className=" bottom-0 left-0">
        <ResponsiveContainer width="100%" height={50}>
          <BarChart
            data={spanData}
            layout="vertical"
            barSize={30} // Increased bar size
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              domain={domain}
              label={{
                value: "Duration (s)",
                position: "insideBottomRight",
                offset: -10,
              }}
              tickCount={10}
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
              cursor={{ fill: "rgb(248, 250, 252)" }}
              content={(props) => {
                const { payload } = props;

                const trace: BarChartTrace = payload?.[0]?.payload;
                return (
                  <Col className="bg-slate-50 p-2 gap-2 rounded border border-slate-200 z-50">
                    <Row className="justify-between">
                      <Row className="gap-2 items-center">
                        <h3 className="text-sm font-semibold text-slate-700">
                          {trace?.name}
                        </h3>
                        {/* <div
                          className={clsx(
                            "w-2 h-2 rounded-lg animate-pulse",
                            bgColor
                          )}
                        ></div> */}
                      </Row>
                      <Row className="gap-1 items-center">
                        <Clock4Icon
                          width={16}
                          height={16}
                          className="text-slate-500"
                        />
                        <p className="text-xs font-normal text-slate-500">
                          {trace?.duration}s
                        </p>
                      </Row>
                    </Row>
                    <p className="text-xs font-normal text-slate-500">
                      <span className="font-semibold">Start:</span>{" "}
                      {new Date(
                        trace?.trace.request.createdAt ?? 0
                      ).toLocaleString()}
                    </p>
                  </Col>
                );
              }}
            />
            <Bar
              dataKey="start"
              stackId="a"
              fill="rgba(0,0,0,0)"
              isAnimationActive={false}
            >
              {/* {spanData.map((entry, index) => (
                 <Cell key={`cell-${index}`} />
               ))} */}
            </Bar>
            <Bar
              dataKey="duration"
              stackId="a"
              fill="rgba(0,0,0,0)"
              // className="text-black"
            ></Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

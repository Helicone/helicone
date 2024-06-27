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
import { Session, Trace } from "../../../lib/sessions/sessionTypes";
import { Col } from "../../layout/common/col";
import { clsx } from "../clsx";

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
}: {
  session: Session;
  selectedRequestIdDispatch: [string, (x: string) => void];
}) => {
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;
  const spanData: BarChartTrace[] = session.traces.map((trace, index) => ({
    name: `/${trace.path.split("/").pop() ?? ""}`,
    path: trace.path ?? "",
    start:
      (trace.start_unix_timestamp_ms - session.start_time_unix_timestamp_ms) /
      1000,
    duration:
      (trace.end_unix_timestamp_ms - trace.start_unix_timestamp_ms) / 1000,
    trace: trace,
  }));

  return (
    <div className="m-10" style={{ height: "500px", overflowY: "auto" }}>
      <ResponsiveContainer width="100%" height={spanData.length * 50}>
        <BarChart
          data={spanData}
          layout="vertical"
          barSize={30} // Increased bar size
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          // style={{ backgroundColor: "#f5f5f5" }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            domain={[0, spanData.length]}
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
            cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
            content={(props) => {
              const { payload } = props;
              const trace: BarChartTrace = payload?.[0]?.payload;
              return (
                <Col className="bg-white p-2 gap-10">
                  <div>{trace?.name}</div>
                  <Col className="text-gray-500">
                    <div>Duration: {trace?.duration}s</div>
                    <div>
                      Start:{" "}
                      {new Date(
                        trace?.trace.request.createdAt ?? 0
                      ).toISOString()}
                    </div>
                  </Col>
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
            {spanData.map((entry, index) => (
              <Cell key={`cell-${index}`} />
            ))}
          </Bar>
          <Bar
            dataKey="duration"
            stackId="a"
            // className="text-black"
            isAnimationActive={false}
          >
            <LabelList
              dataKey="name"
              position="insideLeft"
              className=""
              style={{
                fontSize: "12px",
                fill: "#000",
                opacity: 50,
              }}
            />
            {spanData.map((entry, index) => (
              <Cell
                key={`colored-cell-${index}`}
                className={clsx(
                  entry.trace.request_id === selectedRequestId
                    ? "fill-[#92C5FD]"
                    : "fill-[#BFDBFE] "
                )}
                onClick={() => setSelectedRequestId(entry.trace.request_id)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

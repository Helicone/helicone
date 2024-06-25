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
import { Session } from "../../../lib/sessions/sessionTypes";

export const TraceSpan = ({ session }: { session: Session }) => {
  const spanData = session.traces.map((trace, index) => ({
    name: trace.path.split("/").pop() ?? "",
    path: trace.path ?? "",
    start:
      (trace.start_unix_timestamp_ms - session.start_time_unix_timestamp_ms) /
      1000,
    duration:
      (trace.end_unix_timestamp_ms - trace.start_unix_timestamp_ms) / 1000,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={spanData}
        layout="vertical"
        barSize={15}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          label={{
            value: "Duration (s)",
            position: "insideBottomRight",
            offset: -10,
          }}
        />
        <YAxis
          dataKey="name"
          type="category"
          interval={0}
          tick={{ fontSize: 12 }}
          width={100}
          label={{
            value: "Trace Path",
            angle: -90,
            position: "insideLeft",
            offset: -5,
          }}
        />
        <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
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
          fill="#8884d8"
          isAnimationActive={false}
        >
          <LabelList
            dataKey="name"
            position="insideLeft"
            className="text-white z-50"
            style={{ fontSize: "12px", fill: "#fff" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

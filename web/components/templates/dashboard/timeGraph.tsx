import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface LineChartData {
  time: Date;
  value: number;
}

export const RenderLineChart = ({
  data,
  timeMap,
}: {
  data: LineChartData[];
  timeMap: (date: Date) => string;
}) => {
  const chartData = data.map((d) => ({
    ...d,
    value: d.value.toFixed(2),
    time: timeMap(d.time),
  }));

  console.log(chartData);

  return (
    <ResponsiveContainer className="w-full h-full">
      <LineChart data={chartData}>
        <CartesianGrid vertical={false} opacity={50} strokeOpacity={0.5} />
        <Line
          type="monotone"
          dot={false}
          dataKey="value"
          stroke="#8884d8"
          strokeWidth={1.5}
          animationDuration={0}
        />
        <XAxis dataKey="time" />
        <Tooltip />
        <YAxis />
      </LineChart>
    </ResponsiveContainer>
  );
};

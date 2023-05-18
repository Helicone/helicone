import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
];

export function StackedBarChart<T>({
  data,
  keys,
}: {
  data: {
    time: string;
  }[];
  keys: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{
          right: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        {keys.map((code, i) => (
          <Bar
            key={i}
            dataKey={code}
            stackId="a"
            fill={COLORS[i % COLORS.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

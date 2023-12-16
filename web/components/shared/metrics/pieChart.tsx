import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RenderPieChartProps {
  data: {
    name: string;
    value: number;
  }[];
  size?: "sm" | "md";
}

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

export const RenderPieChart = (props: RenderPieChartProps) => {
  const { data, size = "md" } = props;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const pieRadius = size === "sm" ? 80 : 100;
  const textSize = size === "sm" ? "text-sm" : "text-md";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart width={500} height={500}>
        <Pie
          dataKey="value"
          isAnimationActive={false}
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={pieRadius}
          labelLine={false}
          fill="#8884d8"
          label={renderCustomizedLabel}
          className={textSize}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChart;

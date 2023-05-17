import { PureComponent } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { clsx } from "../../shared/clsx";

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

interface Props {
  data: {
    name: string;
    value: number;
  }[];
  isLoading?: boolean;
}

export default class ThemedPieChart extends PureComponent<Props> {
  render() {
    const { data, isLoading } = this.props;

    const dataToRender = isLoading
      ? [
          { name: "Loading...", value: Math.random() * 100 },
          { name: "Loading...", value: Math.random() * 100 },
          { name: "Loading...", value: Math.random() * 100 },
          { name: "Loading...", value: Math.random() * 100 },
          { name: "Loading...", value: Math.random() * 100 },
        ]
      : data;

    const RADIAN = Math.PI / 180;

    const renderCustomizedLabel = ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
      index,
    }: any) => {
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

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          width={500}
          height={500}
          className={clsx(isLoading ? "animate-pulse" : "")}
        >
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={dataToRender}
            cx="50%"
            cy="50%"
            outerRadius={100}
            labelLine={false}
            fill="#8884d8"
            label={renderCustomizedLabel}
            className="text-md"
          >
            {dataToRender.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }
}

import { PureComponent } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
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

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          width={400}
          height={400}
          className={clsx(isLoading ? "animate-pulse" : "")}
        >
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={dataToRender}
            cx="50%"
            cy="50%"
            outerRadius={50}
            fill="#8884d8"
            label={(entry) => entry.name}
            className="text-xs"
          >
            {dataToRender.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }
}

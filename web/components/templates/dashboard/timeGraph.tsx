import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { getUSDate, getUSDateShort } from "../../shared/utils/utils";

export interface LineChartData {
  time: Date;
  value: number;
}

export const RenderLineChart = ({
  data,
  timeMap,
  valueFormatter,
}: {
  data: LineChartData[];
  timeMap: (date: Date) => string;
  valueFormatter?: (value: ValueType) => string | string[];
}) => {
  const chartData = data.map((d) => ({
    ...d,
    value: d.value.toFixed(2),
    time: timeMap(d.time),
  }));

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
        <YAxis />
        <Tooltip
          formatter={(value) =>
            valueFormatter ? valueFormatter(value) : value
          }
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

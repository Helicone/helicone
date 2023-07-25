import {
  Bar,
  BarChart,
  CartesianAxis,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { getUSDate, getUSDateShort } from "../utils/utils";
import { clsx } from "../clsx";

export interface BarChartData {
  time: Date;
  value: number;
}

export const RenderBarChart = ({
  data,
  timeMap,
  valueLabel,
}: {
  data: BarChartData[];
  timeMap: (date: Date) => string;
  valueLabel?: string;
}) => {
  const chartData = data.map((d) => ({
    ...d,
    time: timeMap(d.time),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart width={500} height={300} data={chartData}>
        <CartesianAxis strokeDasharray={"3 3"} />
        <XAxis dataKey="time" tickSize={4} fontSize={12} />
        <YAxis hide />
        <Tooltip />
        <Bar dataKey="value" fill="#0ea4e9" name={valueLabel} />
      </BarChart>
    </ResponsiveContainer>
  );
};

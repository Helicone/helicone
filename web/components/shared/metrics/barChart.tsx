import {
  Bar,
  BarChart,
  CartesianAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface BarChartData {
  time: Date;
  value: number;
}

export const RenderBarChart = ({
  data,
  timeMap,
  valueLabel,
  labelFormatter,
}: {
  data: BarChartData[];
  timeMap: (date: Date) => string;
  valueLabel?: string;
  labelFormatter?: (value: string) => string;
}) => {
  const chartData = data.map((d) => ({
    ...d,
    time: timeMap(d.time),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart width={500} height={300} data={chartData} syncId="dashboard">
        <CartesianAxis strokeDasharray={"3 3"} />
        <XAxis dataKey="time" tickSize={4} fontSize={12} />
        <YAxis hide />
        <Tooltip
          formatter={(value) =>
            labelFormatter ? labelFormatter(value.toString()) : value.toString()
          }
        />
        <Bar dataKey="value" fill="#0ea4e9" name={valueLabel} />
      </BarChart>
    </ResponsiveContainer>
  );
};

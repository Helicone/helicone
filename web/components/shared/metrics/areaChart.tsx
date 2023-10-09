import {
  Area,
  AreaChart,
  CartesianAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface AreaChartData {
  time: Date;
  value: number;
}

export const RenderAreaChart = ({
  data,
  timeMap,
  valueLabel,
  labelFormatter,
}: {
  data: AreaChartData[];
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
      <AreaChart width={500} height={300} data={chartData} syncId="dashboard">
        <CartesianAxis strokeDasharray={"3 3"} />
        <XAxis dataKey="time" tickSize={4} fontSize={12} />
        <YAxis hide />

        <Tooltip
          formatter={(value) =>
            labelFormatter ? labelFormatter(value.toString()) : value.toString()
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#0ea4e9"
          fill="#E1F5FE"
          name={valueLabel}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

import {
  Area,
  AreaChart,
  CartesianAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DoubleAreaChartData {
  time: Date;
  value1: number;
  value2: number;
}

export const RenderDoubleAreaChart = ({
  data,
  timeMap,
  valueLabel1,
  valueLabel2,
  labelFormatter,
}: {
  data: DoubleAreaChartData[];
  timeMap: (date: Date) => string;
  valueLabel1?: string;
  valueLabel2?: string;
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
          dataKey="value1"
          stroke="#4CAF50"
          fill="#E8F5E9"
          name={valueLabel1}
        />
        <Area
          type="monotone"
          dataKey="value2"
          stroke="#F44336"
          fill="#FFEBEE"
          name={valueLabel2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

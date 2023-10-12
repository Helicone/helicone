import { Card, Title, AreaChart } from "@tremor/react";
import { Style } from "util";

interface StyledAreaChartProps {
  title: string;
  value: string | number;
  children: React.ReactNode;
}

const StyledAreaChart = (props: StyledAreaChartProps) => {
  const { title, value, children } = props;
  return (
    <Card>
      <div className="flex flex-col space-y-0.5">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-black text-xl font-semibold">{value}</p>
      </div>
      {children}
    </Card>
  );
};

export default StyledAreaChart;

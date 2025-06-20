import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import StatsCard from "./StatsCard";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CostsCardProps {
  totalCost: string;
  isLoading: boolean;
  data: {
    date: string;
    cost: number;
  }[];
}

const chartConfig = {
  cost: {
    label: "Cost",
    color: "oklch(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function CostsCard({
  totalCost,
  isLoading,
  data,
}: CostsCardProps) {
  return (
    <StatsCard title="Costs" value={totalCost} isLoading={isLoading}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="cost" fill="var(--color-cost)" />
        </BarChart>
      </ChartContainer>
    </StatsCard>
  );
}

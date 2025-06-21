import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import StatsCard from "./StatsCard";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface UsersCardProps {
  totalUsers: string;
  isLoading: boolean;
  data: {
    date: string;
    users: number;
  }[];
}

const chartConfig = {
  users: {
    label: "Users",
    color: "oklch(var(--chart-10))",
  },
} satisfies ChartConfig;

export default function UsersCard({
  totalUsers,
  isLoading,
  data,
}: UsersCardProps) {
  return (
    <StatsCard title="Users" value={totalUsers} isLoading={isLoading}>
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
          <Bar dataKey="users" fill="var(--color-users)" />
        </BarChart>
      </ChartContainer>
    </StatsCard>
  );
}

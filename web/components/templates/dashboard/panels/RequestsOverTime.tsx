import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { AreaChart } from "recharts";
import { CartesianGrid } from "recharts";
import { XAxis } from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area } from "recharts";
import StatsCard from "./StatsCard";

const requestsChartConfig = {
  success: {
    label: "Success",
    color: "oklch(var(--chart-3))",
  },
  error: {
    label: "Error",
    color: "oklch(var(--chart-4))",
  },
} satisfies ChartConfig;
const RequestsOverTime = (props: {
  isLoading: boolean;
  flattenedOverTime: {
    date: string;
    success: number;
    error: number;
  }[];
  requestsOverTime: string;
}) => {
  const { isLoading, flattenedOverTime, requestsOverTime } = props;
  return (
    <StatsCard title="Requests" value={requestsOverTime} isLoading={isLoading}>
      <ChartContainer className="h-full w-full" config={requestsChartConfig}>
        <AreaChart data={flattenedOverTime}>
          <ChartLegend
            layout="horizontal"
            verticalAlign="top"
            align="right"
            height={36}
            content={<ChartLegendContent />}
          />
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            // tickFormatter={(value) => {
            //   return dateFormat(value, "mmm d 'yy");
            // }}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <defs>
            <linearGradient id="fillSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-success)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-success)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="fillError" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-error)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-error)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="success"
            fill="url(#fillSuccess)"
            stroke="var(--color-success)"
            fillOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="error"
            fill="url(#fillError)"
            fillOpacity={0.4}
            stroke="var(--color-error)"
          />
        </AreaChart>
      </ChartContainer>
    </StatsCard>
  );
};

export default RequestsOverTime;

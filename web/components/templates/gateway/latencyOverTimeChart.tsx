"use client";

import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import useGatewayRouterStats from "./useGatewayRouterStats";
import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import { TimeFilter } from "@/types/timeFilter";
import { useMemo } from "react";
import { getTimeMap } from "@/lib/timeCalculations/constants";
import { formatNumberString } from "../dashboard/dashboardPage";

export const description = "A stacked area chart";

// const chartData = [
//   { month: "January", desktop: 186, mobile: 80 },
//   { month: "February", desktop: 305, mobile: 200 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
// ];

const chartConfig = {
  duration: {
    label: "Duration",
    color: "oklch(var(--chart-6))",
  },
} satisfies ChartConfig;

export function LatencyOverTimeChart({
  routerHash,
  timeFilter,
  timeIncrement,
  totalRequests,
}: {
  routerHash: string;
  timeFilter: TimeFilter;
  timeIncrement: TimeIncrement;
  totalRequests: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { routerLatencyOverTime, isLoadingRouterLatencyOverTime } =
    useGatewayRouterStats({
      routerHash,
      timeFilter,
      timeZoneDifference: new Date().getTimezoneOffset(),
      dbIncrement: timeIncrement,
    });

  const chartData = useMemo(() => {
    return routerLatencyOverTime?.data?.map((d) => ({
      date: getTimeMap(timeIncrement)(new Date(d.time)),
      duration: d.duration,
    }));
  }, [routerLatencyOverTime]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Latency</CardDescription>
                <CardTitle className="tabular-nums">
                  {formatNumberString(
                    (
                      (chartData?.reduce(
                        (acc, curr) => acc + curr.duration,
                        0,
                      ) ?? 0 / totalRequests) / 1000
                    ).toFixed(2),
                    true,
                  )}
                  s / req
                </CardTitle>
              </div>
              {isOpen ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="duration"
                  type="monotone"
                  fill="var(--color-duration)"
                  fillOpacity={0.4}
                  stroke="var(--color-duration)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

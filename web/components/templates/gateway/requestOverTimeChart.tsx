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
  success: {
    label: "Success",
    color: "oklch(var(--chart-3))",
  },
  error: {
    label: "Error",
    color: "oklch(var(--chart-4))",
  },
} satisfies ChartConfig;

export function RequestOverTimeChart({
  routerHash,
  timeFilter,
  timeIncrement,
}: {
  routerHash: string;
  timeFilter: TimeFilter;
  timeIncrement: TimeIncrement;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { routerRequestsOverTime, isLoadingRouterRequestsOverTime } =
    useGatewayRouterStats({
      routerHash,
      timeFilter,
      timeZoneDifference: new Date().getTimezoneOffset(),
      dbIncrement: timeIncrement,
    });

  const getStatusCountsOverTime = useMemo(() => {
    const statusCounts: {
      overTime: { [key: string]: { success: number; error: number } };
      accStatusCounts: { [key: string]: number };
    } = {
      overTime: {},
      accStatusCounts: {},
    };
    routerRequestsOverTime?.data?.forEach((d) => {
      const formattedTime = new Date(d.time).toUTCString();
      if (statusCounts.overTime[formattedTime] === undefined) {
        statusCounts.overTime[formattedTime] = {
          success: 0,
          error: 0,
        };
      }
      if (d.status === 200) {
        statusCounts.overTime[formattedTime]["success"] += d.count;
      } else {
        statusCounts.overTime[formattedTime]["error"] += d.count;
      }
    });
    return statusCounts;
  }, [routerRequestsOverTime]);

  const chartData = useMemo(() => {
    return Object.entries(getStatusCountsOverTime.overTime).map(
      ([time, counts]) => {
        return {
          time,
          success: counts.success,
          error: counts.error,
        };
      },
    );
  }, [getStatusCountsOverTime]);

  const totalRequests = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.success + curr.error, 0);
  }, [chartData]);
  const flattenedOverTime = Object.entries(
    getStatusCountsOverTime.overTime,
  ).map(([time, counts]) => {
    return {
      date: getTimeMap(timeIncrement)(new Date(time)),
      success: counts.success,
      error: counts.error,
    };
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Requests</CardDescription>
                <CardTitle className="tabular-nums">{totalRequests}</CardTitle>
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
              <AreaChart accessibilityLayer data={flattenedOverTime}>
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
                  dataKey="success"
                  type="monotone"
                  fill="var(--color-success)"
                  fillOpacity={0.4}
                  stroke="var(--color-success)"
                />
                <Area
                  dataKey="error"
                  type="monotone"
                  fill="var(--color-error)"
                  fillOpacity={0.4}
                  stroke="var(--color-error)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

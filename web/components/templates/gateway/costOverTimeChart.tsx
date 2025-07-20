"use client";

import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
  cost: {
    label: "Cost",
    color: "oklch(var(--chart-9))",
  },
} satisfies ChartConfig;

export function CostOverTimeChart({
  routerHash,
  timeFilter,
  timeIncrement,
}: {
  routerHash: string;
  timeFilter: TimeFilter;
  timeIncrement: TimeIncrement;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { routerCostOverTime, isLoadingRouterCostOverTime } =
    useGatewayRouterStats({
      routerHash,
      timeFilter,
      timeZoneDifference: new Date().getTimezoneOffset(),
      dbIncrement: timeIncrement,
    });

  const chartData = useMemo(() => {
    return routerCostOverTime?.data?.map((d) => ({
      date: getTimeMap(timeIncrement)(new Date(d.time)),
      cost: d.cost,
    }));
  }, [routerCostOverTime]);

  const totalCost = useMemo(() => {
    return chartData?.reduce((acc, curr) => acc + curr.cost, 0);
  }, [chartData]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Cost</CardDescription>
                <CardTitle className="tabular-nums">
                  {/* {formatNumberString( */}
                  {totalCost
                    ? totalCost < 0.02
                      ? `$${totalCost.toFixed(7)}`
                      : `$${totalCost.toFixed(2)}`
                    : "$0.00"}
                  {/* true,
                  )} */}
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
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <Bar dataKey="cost" fill="var(--color-cost)" />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      valueFormatter={(value) => {
                        return value
                          ? Number(value) < 0.02
                            ? `$${Number(value).toFixed(7)}`
                            : `$${Number(value).toFixed(2)}`
                          : "$0.00";
                      }}
                    />
                  }
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

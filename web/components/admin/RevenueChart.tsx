// RevenueChart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/uiUtils";
import { InvoiceData } from "@/lib/admin/RevenueCalculator";
import { H3, Small, Muted } from "@/components/ui/typography";

interface RevenueChartProps {
  billedInvoices: InvoiceData[];
  upcomingInvoices: InvoiceData[];
  title: string;
  months?: number; // Number of months to display
}

interface ChartDataItem {
  month: string;
  monthKey: string;
  billed: number;
  billed_original: string;
  upcoming: number;
  upcoming_original: string;
  total: number;
  total_original: string;
}

// Using Helicone's chart color system from the style guide
const chartConfig = {
  billed: {
    label: "Billed Revenue",
    color: "rgb(38, 98, 217)", // Blue
  },
  upcoming: {
    label: "Upcoming Revenue",
    color: "rgb(226, 54, 112)", // Pink/Magenta
  },
} satisfies ChartConfig;

export function RevenueChart({
  billedInvoices,
  upcomingInvoices,
  title,
  months = 6,
}: RevenueChartProps) {
  // Transform data for the chart
  const chartData = transformInvoiceData(
    billedInvoices,
    upcomingInvoices,
    months
  );

  // Calculate trend
  const trend = calculateTrend(chartData);

  return (
    <Card className="overflow-hidden border-border bg-card text-card-foreground">
      <CardHeader className="pb-3 space-y-1.5">
        <CardTitle>
          <H3>{title} Revenue</H3>
        </CardTitle>
        <Muted>Last {months} months</Muted>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <div className="h-[220px]">
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.split(" ")[0].slice(0, 3)}
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <ChartLegend
                content={<ChartLegendContent />}
                verticalAlign="top"
              />
              <Bar
                dataKey="billed"
                stackId="a"
                fill="var(--color-billed)"
                radius={[0, 0, 4, 4]}
                animationDuration={500}
              />
              <Bar
                dataKey="upcoming"
                stackId="a"
                fill="var(--color-upcoming)"
                radius={[4, 4, 0, 0]}
                animationDuration={500}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 pt-4 pb-4 border-t">
        {trend && (
          <div className="flex items-center gap-2">
            {trend.direction === "up" ? (
              <>
                <TrendingUp className="h-4 w-4 text-confirmative" />
                <Small>Trending up by {trend.percentage}% this month</Small>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-destructive" />
                <Small>Trending down by {trend.percentage}% this month</Small>
              </>
            )}
          </div>
        )}
        <Muted>Total: {formatCurrency(getTotalRevenue(chartData))}</Muted>
      </CardFooter>
    </Card>
  );
}

// Helper function to calculate total revenue across all months
function getTotalRevenue(chartData: ChartDataItem[]): number {
  return chartData.reduce((sum, item) => sum + item.total, 0);
}

// Helper function to transform invoice data into chart-friendly format
function transformInvoiceData(
  billedInvoices: InvoiceData[],
  upcomingInvoices: InvoiceData[],
  months: number
): ChartDataItem[] {
  // Get date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - (months - 1));

  // Create month buckets
  const monthBuckets: Record<string, ChartDataItem> = {};

  // Initialize buckets for each month in the range
  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthName = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    monthBuckets[monthKey] = {
      month: monthName,
      monthKey,
      billed: 0,
      billed_original: "$0",
      upcoming: 0,
      upcoming_original: "$0",
      total: 0,
      total_original: "$0",
    };
  }

  // Process billed invoices
  billedInvoices.forEach((invoice) => {
    const date = invoice.created;
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    // Only include if in our date range
    if (monthBuckets[monthKey]) {
      monthBuckets[monthKey].billed += invoice.amountAfterDiscount;
      monthBuckets[monthKey].total += invoice.amountAfterDiscount;
    }
  });

  // Process upcoming invoices - only add to current month
  const currentMonthKey = `${endDate.getFullYear()}-${String(
    endDate.getMonth() + 1
  ).padStart(2, "0")}`;
  upcomingInvoices.forEach((invoice) => {
    if (monthBuckets[currentMonthKey]) {
      monthBuckets[currentMonthKey].upcoming += invoice.amountAfterDiscount;
      monthBuckets[currentMonthKey].total += invoice.amountAfterDiscount;
    }
  });

  // Format for display
  Object.values(monthBuckets).forEach((bucket) => {
    bucket.billed_original = formatCurrency(bucket.billed);
    bucket.upcoming_original = formatCurrency(bucket.upcoming);
    bucket.total_original = formatCurrency(bucket.total);
  });

  // Convert to array and sort by month
  return Object.values(monthBuckets).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey)
  );
}

// Helper function to calculate trend
function calculateTrend(chartData: ChartDataItem[]) {
  if (chartData.length < 2) return null;

  // Get current and previous month data
  const currentMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];

  if (previousMonth.total === 0) return null;

  const percentChange =
    ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100;

  return {
    direction: percentChange >= 0 ? "up" : "down",
    percentage: Math.abs(percentChange).toFixed(1),
  };
}

// Custom tooltip component that shows total as the first item
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  // Find the data for this month
  const monthData = payload[0].payload;
  const hasUpcoming = monthData.upcoming > 0;

  return (
    <div className="min-w-[8rem] rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl text-popover-foreground">
      {/* Month heading */}
      <div className="font-medium mb-1.5 border-b border-border pb-1.5">
        {label}
      </div>

      {/* Total (always show) */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium">Total Revenue:</span>
        <span className="font-mono font-medium ml-4">
          {monthData.total_original}
        </span>
      </div>

      {/* Breakdown */}
      <div className="text-xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: "rgb(38, 98, 217)" }}
            ></div>
            <span>Billed:</span>
          </div>
          <span className="font-mono">{monthData.billed_original}</span>
        </div>

        {hasUpcoming && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-[2px]"
                style={{ backgroundColor: "rgb(226, 54, 112)" }}
              ></div>
              <span>Upcoming:</span>
            </div>
            <span className="font-mono">{monthData.upcoming_original}</span>
          </div>
        )}
      </div>
    </div>
  );
}

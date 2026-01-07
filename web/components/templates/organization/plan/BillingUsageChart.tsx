import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useBillingUsage } from "../../pricing/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS } from "@/lib/chartColors";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";
import {
  calculateGBCost,
  calculateRequestCost,
} from "@helicone-package/pricing";

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(Math.round(num));
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatGB = (gb: number): string => {
  if (gb < 0.01) return `${(gb * 1024).toFixed(2)} MB`;
  return `${gb.toFixed(2)} GB`;
};

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    payload: {
      date: string;
      isProjected: boolean;
      requests: number;
      gb: number;
      requestsCost: number;
      gbCost: number;
    };
  }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const totalCost = data.requestsCost + data.gbCost;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 font-medium">
        {data.date}
        {data.isProjected && (
          <span className="ml-2 text-xs text-muted-foreground">(Projected)</span>
        )}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Requests:</span>
          <span>{formatNumber(data.requests)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Storage:</span>
          <span>{formatGB(data.gb)}</span>
        </div>
        <div className="my-1 border-t" />
        <div className="flex justify-between gap-4">
          <span style={{ color: CHART_COLORS.blue }}>Request cost:</span>
          <span>{formatCurrency(data.requestsCost)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: CHART_COLORS.purple }}>Storage cost:</span>
          <span>{formatCurrency(data.gbCost)}</span>
        </div>
        <div className="my-1 border-t" />
        <div className="flex justify-between gap-4 font-medium">
          <span>Total:</span>
          <span>{formatCurrency(totalCost)}</span>
        </div>
      </div>
    </div>
  );
};

export const BillingUsageChart = () => {
  const org = useOrg();
  const { data: usageStats, isLoading, error } = useBillingUsage();

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET("/v1/stripe/subscription");
    },
    enabled: !!org?.currentOrg?.id,
  });

  // Check if user is in an active trial
  const isTrialActive =
    subscription.data?.data?.trial_end &&
    new Date(subscription.data.data.trial_end * 1000) > new Date() &&
    (!subscription.data?.data?.current_period_start ||
      new Date(subscription.data.data.trial_end * 1000) >
        new Date(subscription.data.data.current_period_start * 1000));

  // Hide chart during trial
  if (isTrialActive) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (error || !usageStats) {
    return null;
  }

  // Calculate average daily usage from last 7 days (or all data if less)
  const recentDays = usageStats.dailyData.slice(-7);
  const avgDailyRequests =
    recentDays.length > 0
      ? recentDays.reduce((sum, d) => sum + d.requests, 0) / recentDays.length
      : 0;
  const avgDailyGB =
    recentDays.length > 0
      ? recentDays.reduce((sum, d) => sum + d.bytes, 0) /
        recentDays.length /
        (1024 * 1024 * 1024)
      : 0;

  // Build cumulative chart data with costs
  let cumulativeRequests = 0;
  let cumulativeGB = 0;

  const actualData = usageStats.dailyData.map((day) => {
    cumulativeRequests += day.requests;
    cumulativeGB += day.bytes / (1024 * 1024 * 1024);
    const requestsCost = calculateRequestCost(cumulativeRequests).cost;
    const gbCost = calculateGBCost(cumulativeGB).cost;
    return {
      date: new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: day.date,
      isProjected: false,
      requests: cumulativeRequests,
      gb: cumulativeGB,
      requestsCost,
      gbCost,
      // For stacked area chart - actual values (null for projected data points)
      actualRequestsCost: requestsCost as number | null,
      actualGBCost: gbCost as number | null,
      // Projected values (null for actual data points)
      projectedRequestsCost: null as number | null,
      projectedGBCost: null as number | null,
    };
  });

  // Generate projected days from today to end of billing period
  const periodEnd = new Date(usageStats.billingPeriod.end);
  const lastActualDate =
    usageStats.dailyData.length > 0
      ? new Date(usageStats.dailyData[usageStats.dailyData.length - 1].date)
      : new Date(usageStats.billingPeriod.start);

  const projectedData: typeof actualData = [];
  const currentDate = new Date(lastActualDate);
  currentDate.setDate(currentDate.getDate() + 1);

  let projectedCumulativeRequests = cumulativeRequests;
  let projectedCumulativeGB = cumulativeGB;

  while (currentDate < periodEnd) {
    projectedCumulativeRequests += avgDailyRequests;
    projectedCumulativeGB += avgDailyGB;
    const requestsCost = calculateRequestCost(projectedCumulativeRequests).cost;
    const gbCost = calculateGBCost(projectedCumulativeGB).cost;
    projectedData.push({
      date: currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: currentDate.toISOString().split("T")[0],
      isProjected: true,
      requests: projectedCumulativeRequests,
      gb: projectedCumulativeGB,
      requestsCost,
      gbCost,
      actualRequestsCost: null,
      actualGBCost: null,
      projectedRequestsCost: requestsCost,
      projectedGBCost: gbCost,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add bridge point: last actual day also gets projected value for smooth line
  if (actualData.length > 0) {
    const lastActual = actualData[actualData.length - 1];
    lastActual.projectedRequestsCost = lastActual.requestsCost;
    lastActual.projectedGBCost = lastActual.gbCost;
  }

  const chartData = [...actualData, ...projectedData];

  const progressPercent = Math.min(
    (usageStats.billingPeriod.daysElapsed / usageStats.billingPeriod.daysTotal) *
      100,
    100
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-medium">Usage-Based Charges</h3>
        <p className="text-sm text-muted-foreground">
          Additional charges based on your request volume and storage (excludes base plan price)
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Current Usage Spend</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(usageStats.estimatedCost.totalCost)}
          </p>
          <p className="text-xs text-muted-foreground">
            {usageStats.billingPeriod.daysElapsed} of{" "}
            {usageStats.billingPeriod.daysTotal} days
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Projected Usage Spend</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(usageStats.estimatedCost.projectedMonthlyTotalCost)}
          </p>
          <p className="text-xs text-muted-foreground">End of billing period estimate</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Usage</p>
          <p className="text-lg font-semibold">
            {formatNumber(usageStats.usage.totalRequests)} requests
          </p>
          <p className="text-sm text-muted-foreground">
            {usageStats.usage.totalGB.toFixed(2)} GB storage
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Billing period progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-sky-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stacked Cost Chart */}
      <div>
        <ChartContainer
          config={{
            actualRequestsCost: {
              label: "Request Cost",
              color: CHART_COLORS.blue,
            },
            actualGBCost: {
              label: "Storage Cost",
              color: CHART_COLORS.purple,
            },
            projectedRequestsCost: {
              label: "Projected Request Cost",
              color: CHART_COLORS.blue,
            },
            projectedGBCost: {
              label: "Projected Storage Cost",
              color: CHART_COLORS.purple,
            },
          }}
          className="h-[200px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              {/* Actual gradients */}
              <linearGradient id="fillActualRequests" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.blue}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.blue}
                  stopOpacity={0.2}
                />
              </linearGradient>
              <linearGradient id="fillActualGB" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.purple}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.purple}
                  stopOpacity={0.2}
                />
              </linearGradient>
              {/* Projected gradients (lighter) */}
              <linearGradient id="fillProjectedRequests" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.blue}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.blue}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillProjectedGB" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.purple}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.purple}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Actual data - stacked */}
            <Area
              dataKey="actualGBCost"
              type="monotone"
              fill="url(#fillActualGB)"
              stroke={CHART_COLORS.purple}
              stackId="actual"
              connectNulls={false}
            />
            <Area
              dataKey="actualRequestsCost"
              type="monotone"
              fill="url(#fillActualRequests)"
              stroke={CHART_COLORS.blue}
              stackId="actual"
              connectNulls={false}
            />
            {/* Projected data - stacked with dashed stroke */}
            <Area
              dataKey="projectedGBCost"
              type="monotone"
              fill="url(#fillProjectedGB)"
              stroke={CHART_COLORS.purple}
              strokeDasharray="5 5"
              stackId="projected"
              connectNulls={false}
            />
            <Area
              dataKey="projectedRequestsCost"
              type="monotone"
              fill="url(#fillProjectedRequests)"
              stroke={CHART_COLORS.blue}
              strokeDasharray="5 5"
              stackId="projected"
              connectNulls={false}
            />
          </AreaChart>
        </ChartContainer>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: CHART_COLORS.blue }}
            />
            <span className="text-muted-foreground">Requests</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: CHART_COLORS.purple }}
            />
            <span className="text-muted-foreground">Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-muted-foreground" />
            <span className="text-muted-foreground">Projected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

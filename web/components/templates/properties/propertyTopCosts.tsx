import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { H4, Small, Muted } from "@/components/ui/typography";
import { formatCurrency } from "@/lib/uiUtils";

interface PropertyTopCostsProps {
  property: string;
  timeFilter: {
    start: Date;
    end: Date;
  };
}

// Chart colors - matching the line charts
const CHART_COLORS = [
  "#4f46e5", // indigo-600
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
];

const PropertyTopCosts = ({ property, timeFilter }: PropertyTopCostsProps) => {
  const jawn = useJawnClient();
  const topCosts = useQuery({
    queryKey: ["topCosts", property, timeFilter?.start, timeFilter?.end],
    queryFn: () =>
      jawn.POST("/v1/property/{propertyKey}/top-costs/query", {
        params: {
          path: {
            propertyKey: property,
          },
        },
        body: {
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      }),
    enabled: !!property,
  });

  const chartData = topCosts.data?.data?.data || [];
  const totalCost = chartData.reduce(
    (sum: number, item: any) => sum + Number(item.cost || 0),
    0
  );

  if (!property) {
    return null;
  }

  if (topCosts.isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48 bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center">
            <Skeleton className="h-[250px] w-[250px] rounded-full bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <H4>Top Costs by Value</H4>
            <div className="flex flex-col items-end">
              <Muted className="text-xs">Total</Muted>
              <span className="text-base font-semibold">$0.00</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center">
            <Small className="text-muted-foreground">No cost data available</Small>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <H4>Top Costs by Value</H4>
          <div className="flex flex-col items-end">
            <Muted className="text-xs">Total</Muted>
            <span className="text-base font-semibold">
              {formatCurrency(totalCost, "USD", 2)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[350px] w-full flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="cost"
                nameKey="value"
                cx="50%"
                cy="45%"
                outerRadius="65%"
                innerRadius="45%"
                paddingAngle={2}
                strokeWidth={2}
                className="stroke-card"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;

                  const data = payload[0];
                  const percentage = ((Number(data.value) / totalCost) * 100).toFixed(1);

                  return (
                    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                      <p className="mb-2 text-sm font-medium text-foreground">
                        {data.name || "Empty"}
                      </p>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">Cost:</span>
                          <span className="text-xs font-semibold text-foreground">
                            {formatCurrency(Number(data.value), "USD", 4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">Percentage:</span>
                          <span className="text-xs font-semibold text-foreground">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Custom Legend */}
          <div className="mt-4 flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
            {chartData.slice(0, 10).map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-xs font-medium text-foreground">
                  {entry.value && entry.value.length > 15
                    ? entry.value.substring(0, 15) + "..."
                    : entry.value || "Empty"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyTopCosts;

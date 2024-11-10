import React from "react";
import { ProviderMetrics } from "./ProviderStatusPage";
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip,
} from "recharts";
import { ChartConfig } from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { formatProviderName } from "../utils/formattingUtils";

interface ProviderStatusInfoProps {
  provider: ProviderMetrics | null;
}

const errorChartConfig = {
  errorCount: {
    label: "Errors",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

// Helper function to determine status
const getProviderStatus = (errorRate: number) => {
  if (errorRate <= 0.05) {
    return {
      status: "Operational",
      description: "Low error rate",
      icon: CheckCircle,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
    };
  } else if (errorRate <= 0.5) {
    return {
      status: "Degraded",
      description: "Elevated error rate",
      icon: AlertTriangle,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
    };
  } else {
    return {
      status: "Critical",
      description: "High error rate",
      icon: XCircle,
      color: "text-red-700",
      bgColor: "bg-red-50",
    };
  }
};

export function ProviderStatusInfo({ provider }: ProviderStatusInfoProps) {
  if (!provider) return null;

  const chartData = provider.metrics.timeSeriesData.map((data) => ({
    timestamp: new Date(data.timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    requestCount: data.requestCount,
    errorCount: data.errorCount,
  }));

  const maxErrorCount = Math.max(...chartData.map((data) => data.errorCount));

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left column - Status cards */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="shadow-none border">
          <CardContent className="pt-6">
            {(() => {
              const status = getProviderStatus(provider.metrics.errorRate24h);
              const StatusIcon = status.icon;

              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">
                      {formatProviderName(provider.providerName)} Status
                    </h2>
                    <Badge
                      variant="secondary"
                      className={`${status.bgColor} ${status.color} hover:${status.bgColor} px-3 py-1 text-sm font-medium`}
                    >
                      <StatusIcon className="w-4 h-4 mr-1.5" />
                      {status.status}
                    </Badge>
                  </div>
                  <div className="text-gray-500 text-lg">
                    {status.description} (
                    {(provider.metrics.errorRate24h * 100).toFixed(1)}% error
                    rate)
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Error Count History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis
                    dataKey="timestamp"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={15}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    domain={[0, maxErrorCount]}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="errorCount"
                    stroke="#ef4444"
                    fill="#fee2e2"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center mt-4 text-sm text-muted-foreground">
              <TrendingDown className="w-4 h-4 mr-1" />
              Trending down by{" "}
              {Math.abs(provider.metrics.errorRateChange * 100).toFixed(4)}%
              (Past 24 hours vs previous 24 hours)
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">No recent updates</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
    latency: data.averageLatency,
  }));

  const maxErrorCount = Math.max(...chartData.map((data) => data.errorCount));
  const maxLatency = Math.max(...chartData.map((data) => data.latency));

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <Card className="shadow-none border h-[120px]">
          <CardContent className="pt-6">
            {(() => {
              const status = getProviderStatus(provider.metrics.errorRate24h);
              const StatusIcon = status.icon;

              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">
                      Is {formatProviderName(provider.providerName)} down?
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
                    <span>{status.description}</span>
                    {provider.metrics.errorRate24h > 0 && (
                      <span className="text-gray-400 text-base ml-2">
                        ({provider.metrics.errorRate24h.toFixed(2)}% of requests
                        failing)
                      </span>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Errors in the last 24 hours
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
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {Math.abs(provider.metrics.errorRateChange).toFixed(4)}%{" "}
                  {provider.metrics.errorRateChange < 0 ? "fewer" : "more"}{" "}
                  errors than average
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  Compared to previous 24 hours
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card className="shadow-none border h-[120px]">
          <CardContent className="pt-4">
            <h2 className="text-xl font-bold mb-2">
              Latency in the last 24 hours
            </h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Average latency</div>
                {/* <div className="font-medium">{averageLatency.toFixed(0)}ms</div> */}
              </div>
              <div>
                <div className="text-muted-foreground">Peak latency</div>
                {/* <div className="font-medium">{peakLatency.toFixed(0)}ms</div> */}
              </div>
              <div>
                <div className="text-muted-foreground">P95 latency</div>
                {/* <div className="font-medium">{p95Latency.toFixed(0)}ms</div> */}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Latency in the last 24 hours
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
                    interval={30}
                    domain={[0, maxLatency]}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}ms`}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="#3b82f6"
                    fill="#bfdbfe"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {Math.abs(provider.metrics.latencyChange).toFixed(2)}%{" "}
                  {provider.metrics.latencyChange < 0 ? "faster" : "slower"}{" "}
                  than average
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  Compared to previous 24 hours
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

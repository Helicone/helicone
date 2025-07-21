import React from "react";
import { XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts";
import { ChartTooltip } from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown } from "lucide-react";
import { formatProviderName } from "../utils/formattingUtils";
import { components } from "@/lib/clients/jawnTypes/public";
import { getProviderStatus, TimeFrame } from "./ProviderStatusPage";

interface ProviderStatusInfoProps {
  provider: components["schemas"]["ProviderMetrics"] | null;
  timeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
}

const formatLatency = (value: number) => `${Math.round(value)}ms`;

const formatTooltipTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    }) +
    " " +
    date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
};

// Add this near the top with other constants
const timeFrameLabels: Record<TimeFrame, string> = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
};

export function ProviderStatusInfo({
  provider,
  timeFrame,
  onTimeFrameChange,
}: ProviderStatusInfoProps) {
  // If provider is null, return nothing - loading state will be handled by parent
  if (!provider) return null;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeFrame) {
      case "24h":
        return date.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      case "7d":
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      case "30d":
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const value = payload[0].value;
    const name = payload[0].name;
    const timestamp = formatTooltipTimestamp(label);

    if (name === "errorCount") {
      return (
        <div className="rounded border bg-white p-2 shadow">
          <div className="text-sm text-gray-500">{timestamp}</div>
          <div className="font-medium">{value}</div>
          <div className="text-sm">500 Errors</div>
        </div>
      );
    } else if (name === "latency") {
      return (
        <div className="rounded border bg-white p-2 shadow">
          <div className="text-sm text-gray-500">{timestamp}</div>
          <div className="font-medium">{formatLatency(value)}</div>
          <div className="text-sm">Latency</div>
        </div>
      );
    }
    return null;
  };

  // Ensure we have metrics and timeSeriesData before proceeding
  if (
    !provider.metrics ||
    !provider.metrics.timeSeriesData ||
    provider.metrics.timeSeriesData.length === 0
  ) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">No data available</h2>
          <p className="text-gray-500">
            Unable to retrieve metrics for{" "}
            {formatProviderName(provider.providerName)}
          </p>
        </div>
      </div>
    );
  }

  const chartData = provider.metrics.timeSeriesData.map((data) => ({
    timestamp: data.timestamp,
    originalTimestamp: data.timestamp,
    requestCount: data.requestCount,
    errorCount: data.errorCount,
    latency: data.averageLatency,
  }));

  const maxErrorCount = Math.max(
    ...chartData.map((data) => data.errorCount || 0),
    1
  );
  const maxLatency = Math.max(...chartData.map((data) => data.latency || 0), 1);

  const getXAxisInterval = (chartType: "error" | "latency") => {
    const dataLength = chartData.length;
    let targetTicks;

    switch (timeFrame) {
      case "7d":
        targetTicks = 7;
        break;
      case "24h":
        targetTicks = chartType === "error" ? 8 : 6;
        break;
      case "30d":
        targetTicks = chartType === "error" ? 10 : 8;
        break;
      default:
        targetTicks = chartType === "error" ? 8 : 6;
    }

    return Math.max(1, Math.floor(dataLength / targetTicks));
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="lg:col-span-5">
        <div className="mb-4 flex justify-end gap-2">
          {["24h", "7d", "30d"].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeFrameChange(tf as TimeFrame)}
              className={`rounded-md px-3 py-1 text-sm ${
                timeFrame === tf
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 lg:col-span-3">
        <Card className="h-[120px] border shadow-none">
          <CardContent className="pt-6">
            {(() => {
              const recentErrorRate =
                provider.metrics.recentRequestCount > 0
                  ? (provider.metrics.recentErrorCount /
                      provider.metrics.recentRequestCount) *
                    100
                  : 0;

              const status = getProviderStatus(recentErrorRate);
              const StatusIcon = status.icon;

              return (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">
                      Is {formatProviderName(provider.providerName)} down?
                    </h1>
                    <Badge
                      variant="secondary"
                      className={`${status.bgColor} ${status.color} hover:${status.bgColor} px-3 py-1 text-sm font-medium`}
                    >
                      <StatusIcon className="mr-1.5 h-4 w-4" />
                      {status.status}
                    </Badge>
                  </div>
                  <div className="text-lg text-gray-500">
                    <span>{status.description}</span>
                    {provider.metrics.errorRate24h > 0 && (
                      <span className="ml-2 text-base text-gray-400">
                        ({provider.metrics.errorRate24h.toFixed(2)}% in 24h)
                      </span>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              500 Errors in the last {timeFrameLabels[timeFrame]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                key={`error-${timeFrame}`}
              >
                <AreaChart data={chartData}>
                  <XAxis
                    dataKey="timestamp"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={getXAxisInterval("error")}
                    tickFormatter={(timestamp) => formatTimestamp(timestamp)}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    domain={[0, maxErrorCount]}
                  />
                  <ChartTooltip content={<CustomTooltip />} />
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
                  <TrendingDown className="mr-1 h-4 w-4" />
                  {Math.abs(provider.metrics.errorRateChange).toFixed(4)}%{" "}
                  {provider.metrics.errorRateChange < 0 ? "fewer" : "more"}{" "}
                  errors than average
                </div>
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                  Compared to previous {timeFrameLabels[timeFrame]}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <Card className="h-[120px] border shadow-none">
          <CardContent className="pt-4">
            <h2 className="mb-2 text-xl font-bold">
              Latency in the last {timeFrameLabels[timeFrame]}
            </h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Average latency</div>
                <div className="font-medium">
                  {formatLatency(provider.metrics.averageLatency)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Peak latency</div>
                <div className="font-medium">
                  {formatLatency(
                    Math.max(...chartData.map((data) => data.latency))
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">P95 latency</div>
                <div className="font-medium">
                  {formatLatency(
                    chartData.map((data) => data.latency).sort((a, b) => a - b)[
                      Math.floor(chartData.length * 0.95)
                    ]
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Latency in the last {timeFrameLabels[timeFrame]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                key={`latency-${timeFrame}`}
              >
                <AreaChart data={chartData}>
                  <XAxis
                    dataKey="timestamp"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={getXAxisInterval("latency")}
                    tickFormatter={(timestamp) => formatTimestamp(timestamp)}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}ms`}
                    domain={[0, maxLatency]}
                  />
                  <ChartTooltip content={<CustomTooltip />} />
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
                  <TrendingDown className="mr-1 h-4 w-4" />
                  {Math.abs(provider.metrics.latencyChange).toFixed(2)}%{" "}
                  {provider.metrics.latencyChange < 0 ? "faster" : "slower"}{" "}
                  than average
                </div>
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                  Compared to previous {timeFrameLabels[timeFrame]}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

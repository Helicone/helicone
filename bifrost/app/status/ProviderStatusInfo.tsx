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
        <div className="bg-white p-2 border rounded shadow">
          <div className="text-sm text-gray-500">{timestamp}</div>
          <div className="font-medium">{value}</div>
          <div className="text-sm">500 Errors</div>
        </div>
      );
    } else if (name === "latency") {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <div className="text-sm text-gray-500">{timestamp}</div>
          <div className="font-medium">{formatLatency(value)}</div>
          <div className="text-sm">Latency</div>
        </div>
      );
    }
    return null;
  };

  const chartData = provider.metrics.timeSeriesData.map((data) => ({
    timestamp: data.timestamp,
    originalTimestamp: data.timestamp,
    requestCount: data.requestCount,
    errorCount: data.errorCount,
    latency: data.averageLatency,
  }));

  const maxErrorCount = Math.max(...chartData.map((data) => data.errorCount));
  const maxLatency = Math.max(...chartData.map((data) => data.latency));

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
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-5">
        <div className="flex justify-end gap-2 mb-4">
          {["24h", "7d", "30d"].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeFrameChange(tf as TimeFrame)}
              className={`px-3 py-1 rounded-md text-sm ${
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
                        ({provider.metrics.errorRate24h.toFixed(2)}% in 24h)
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
              500 Errors in the last {timeFrameLabels[timeFrame]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] mt-4">
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
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {Math.abs(provider.metrics.errorRateChange).toFixed(4)}%{" "}
                  {provider.metrics.errorRateChange < 0 ? "fewer" : "more"}{" "}
                  errors than average
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  Compared to previous {timeFrameLabels[timeFrame]}
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
              Latency in the last {timeFrameLabels[timeFrame]}
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
              Latency in the last {timeFrameLabels[timeFrame]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] mt-4">
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
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {Math.abs(provider.metrics.latencyChange).toFixed(2)}%{" "}
                  {provider.metrics.latencyChange < 0 ? "faster" : "slower"}{" "}
                  than average
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
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

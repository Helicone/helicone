import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/ui/chart";
import { components } from "@/lib/clients/jawnTypes/public";
import { formatLatency, formatPercentage } from "../utils/formattingUtils";
import { MetricType } from "./MetricComparisonCard";

interface ModelTimeSeriesChartProps {
  models: components["schemas"]["Model"][];
  metric: MetricType;
}

const ModelTimeSeriesChart = ({
  models,
  metric,
}: ModelTimeSeriesChartProps) => {
  const formatValue = (value: number) => {
    switch (metric) {
      case "latency":
      case "ttft":
        return formatLatency(value);
      case "successRate":
      case "errorRate":
        return formatPercentage(value);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white p-2 border rounded shadow-md">
        <div className="text-xs text-gray-500">
          {new Date(label).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {payload.map((entry: any) => (
          <div key={entry.name} className="text-sm">
            <span className="font-medium">{entry.name}: </span>
            {formatValue(entry.value)}
          </div>
        ))}
      </div>
    );
  };

  const combinedData = models[0].timeSeriesData[metric]
    .map((point) => {
      const matchingPoint = models[1].timeSeriesData[metric].find(
        (p) => p.timestamp === point.timestamp
      );

      return {
        timestamp: point.timestamp,
        [models[0].model]: point.value || null,
        [models[1].model]: matchingPoint?.value || null,
      };
    })
    .filter(Boolean);

  const getYAxisProps = () => {
    if (metric === "successRate" || metric === "errorRate") {
      const allValues = combinedData
        .flatMap((point) => [
          point?.[models[0].model],
          point?.[models[1].model],
        ])
        .filter((value): value is number => typeof value === "number");

      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const range = max - min;
      const padding = range * 0.1;
      const yMin = Math.max(0, min - padding);
      const yMax = Math.min(1, max + padding);

      return {
        domain: [yMin, yMax],
        tickCount: 5,
        tickFormatter: (value: number) => `${(value * 100).toFixed(3)}%`,
      };
    }

    return {
      domain: ["auto", "auto"],
      tickCount: 5,
      tickFormatter: formatValue,
    };
  };

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          data={combinedData}
        >
          {models.map((model, index) => (
            <Area
              key={model.model}
              type="monotone"
              dataKey={model.model}
              stroke={index === 0 ? "#EF4444" : "#3B82F6"}
              fill={index === 0 ? "#EF4444" : "#3B82F6"}
              fillOpacity={0.1}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={true}
            />
          ))}
          <XAxis
            dataKey="timestamp"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#888888" }}
            tickFormatter={(timestamp) =>
              new Date(timestamp).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })
            }
            minTickGap={30}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#888888" }}
            width={60}
            scale="linear"
            {...getYAxisProps()}
          />
          <ChartTooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "#888888",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModelTimeSeriesChart;

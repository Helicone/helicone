"use client";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { ChartTooltip } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";
import { components } from "@/lib/clients/jawnTypes/public";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from "react-simple-maps";
import { scaleQuantile, scaleLinear } from "d3-scale";
import { GeographicLatencyMap } from "./GeoLatencyMap";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { formatLatency } from "../utils/formattingUtils";
import { useMutation, useQuery } from "@tanstack/react-query";

const ModelTimeSeriesChart = ({
  models,
  metric,
}: {
  models: components["schemas"]["Model"][];
  metric: "latency" | "ttft" | "successRate" | "errorRate";
}) => {
  const formatValue = (value: number) => {
    switch (metric) {
      case "latency":
      case "ttft":
        return formatLatency(value);
      case "successRate":
        return `${(value * 100).toFixed(1)}%`;
      case "errorRate":
        return `${(value * 100).toFixed(2)}%`;
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

  const combinedData = models[0].timeSeriesData[metric].map((point) => ({
    timestamp: point.timestamp,
    [models[0].model]: point.value,
    [models[1].model]: models[1].timeSeriesData[metric].find(
      (p) => p.timestamp === point.timestamp
    )?.value,
  }));

  console.log(`Combined data: ${JSON.stringify(combinedData, null, 2)}`);

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
            tickFormatter={formatValue}
            domain={["auto", "auto"]}
            width={60}
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

export function ModelComparisonPage({
  modelA,
  modelB,
}: {
  modelA: string;
  modelB: string;
}) {
  const jawnClient = useJawnClient();
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ["modelComparison", modelA, modelB],
    queryFn: async () => {
      const response = await jawnClient.POST("/v1/public/compare/models", {
        body: { modelA, modelB },
      });
      return response.data?.data ?? null;
    },
  });

  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-center gap-4 mb-8">
        <h1 className="text-2xl md:text-4xl font-bold">Model Comparison</h1>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-3 h-3 bg-red-500 rounded-sm" />
          <select className="border rounded px-3 py-1 w-full md:w-auto">
            <option>{modelA}</option>
          </select>
        </div>
        <span className="text-gray-500 hidden md:block">vs</span>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <select className="border rounded px-3 py-1 w-full md:w-auto">
            <option>{modelB}</option>
          </select>
        </div>
      </div>

      {/* Time series chart */}
      {isLoading ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Loading comparison data...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        comparisonData?.models && (
          <>
            <Card className="mb-8">
              <div className="flex flex-col">
                <div className="flex-1 overflow-x-auto">
                  <CardContent className="p-0">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr>
                          <th className="text-left py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-semibold text-gray-900">
                                Latency
                              </span>
                              <span className="text-xs font-normal text-gray-500 mt-1">
                                per 1000 tokens
                              </span>
                            </div>
                          </th>
                          <th
                            key="median"
                            className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider bg-[#E8F6F8]"
                          >
                            median
                          </th>
                          <th
                            key="average"
                            className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider"
                          >
                            average
                          </th>
                          <th
                            key="p90"
                            className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider"
                          >
                            p90
                          </th>
                          <th
                            key="p95"
                            className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider"
                          >
                            p95
                          </th>
                          <th
                            key="p99"
                            className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider"
                          >
                            p99
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData?.models.map((model, index) => (
                          <tr key={model.model}>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 ${
                                    index === 0 ? "bg-red-500" : "bg-blue-500"
                                  }`}
                                />
                                <span className="text-sm text-gray-600">
                                  {model.model}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 bg-[#E8F6F8]">
                              {formatLatency(model.latency.median)}
                            </td>
                            <td className="py-4 px-6">
                              {formatLatency(model.latency.average)}
                            </td>
                            <td className="py-4 px-6">
                              {formatLatency(model.latency.p90)}
                            </td>
                            <td className="py-4 px-6">
                              {formatLatency(model.latency.p95)}
                            </td>
                            <td className="py-4 px-6">
                              {formatLatency(model.latency.p99)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </div>
                <div className="h-[400px] border-t p-2 md:p-6">
                  <ModelTimeSeriesChart
                    models={comparisonData.models}
                    metric="latency"
                  />
                </div>
                <div className="border-t p-2 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-xl font-semibold">
                      Average Latency by Region
                    </h2>
                    <div className="inline-flex rounded-md bg-gray-50 p-1 w-full sm:w-auto">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedModelIndex(0)}
                        className={`rounded-sm text-sm px-4 flex-1 sm:flex-initial whitespace-normal h-auto py-2 ${
                          selectedModelIndex === 0
                            ? "bg-white text-black shadow-sm"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        {modelA}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedModelIndex(1)}
                        className={`rounded-sm text-sm px-4 flex-1 sm:flex-initial whitespace-normal h-auto py-2 ${
                          selectedModelIndex === 1
                            ? "bg-white text-black shadow-sm"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        {modelB}
                      </Button>
                    </div>
                  </div>
                  <GeographicLatencyMap
                    model={comparisonData.models[selectedModelIndex] ?? null}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          </>
        )
      )}
    </div>
  );
}

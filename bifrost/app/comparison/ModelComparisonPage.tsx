"use client";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import ModelTimeSeriesChart from "./ModelTimeSeriesChart";
import ModelSelector from "./ModelSelector";
import ModelComparisonTable from "./ModelComparisonTable";
import GeographicMetricSection from "./GeographicMetricSection";
import CostComparisonCard from "./CostComparisonCard";
import MetricComparisonCard from "./MetricComparisonCard";
import LoadingCard from "./LoadingCard";
import { PieChart, Pie, Sector, ResponsiveContainer } from "recharts";
import { Tooltip as ChartTooltip } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import FeedbackCard from "./FeedbackCard";

export function ModelComparisonPage({
  modelA,
  providerA,
  modelB,
  providerB,
}: {
  modelA: string;
  providerA: string;
  modelB: string;
  providerB: string;
}) {
  const jawnClient = useJawnClient();
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ["modelComparison", modelA, modelB],
    queryFn: async () => {
      const response = await jawnClient.POST("/v1/public/compare/models", {
        body: { modelA, providerA, modelB, providerB },
      });
      return response.data?.data ?? null;
    },
  });

  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">
            LLM Battle
          </h1>
          <div className="absolute -bottom-1 left-0 right-0 flex justify-center space-x-1">
            <div className="h-[2px] w-2 bg-gray-300 rounded-full" />
            <div className="h-[2px] w-3 bg-gray-400 rounded-full" />
            <div className="h-[2px] w-6 bg-gray-500 rounded-full" />
            <div className="h-[2px] w-24 bg-gray-600 rounded-full" />
            <div className="h-[2px] w-6 bg-gray-500 rounded-full" />
            <div className="h-[2px] w-3 bg-gray-400 rounded-full" />
            <div className="h-[2px] w-2 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>

      <ModelSelector
        modelA={modelA}
        modelB={modelB}
        providerA={providerA}
        providerB={providerB}
      />

      {isLoading ? (
        <LoadingCard />
      ) : (
        comparisonData?.models && (
          <div className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CostComparisonCard models={comparisonData.models} />
              <FeedbackCard models={comparisonData.models} />
            </div>

            {/* Latency Card */}
            <Card className="mb-8">
              <div className="flex flex-col">
                <CardContent className="p-0">
                  <ModelComparisonTable
                    models={comparisonData.models}
                    metric="latency"
                    title="Latency"
                    subtitle="per 1000 tokens"
                  />
                </CardContent>
                <div className="h-[400px] border-t p-2 md:p-6">
                  <ModelTimeSeriesChart
                    models={comparisonData.models}
                    metric="latency"
                  />
                </div>
                <GeographicMetricSection
                  models={comparisonData.models}
                  selectedModelIndex={selectedModelIndex}
                  onModelSelect={setSelectedModelIndex}
                  metric="latency"
                />
              </div>
            </Card>

            {/* TTFT Card */}
            <Card className="mb-8">
              <div className="flex flex-col">
                <CardContent className="p-0">
                  <ModelComparisonTable
                    models={comparisonData.models}
                    metric="ttft"
                    title="Time to First Token"
                    subtitle="milliseconds"
                  />
                </CardContent>
                <div className="h-[400px] border-t p-2 md:p-6">
                  <ModelTimeSeriesChart
                    models={comparisonData.models}
                    metric="ttft"
                  />
                </div>
                <GeographicMetricSection
                  models={comparisonData.models}
                  selectedModelIndex={selectedModelIndex}
                  onModelSelect={setSelectedModelIndex}
                  metric="ttft"
                />
              </div>
            </Card>

            <MetricComparisonCard
              models={comparisonData.models}
              title="Success Rate"
              subtitle="Percentage of successful requests (200s vs 500s)"
              metricKey="successRate"
              metricPath="requestStatus.successRate"
              higherIsBetter={true}
            />
          </div>
        )
      )}
    </div>
  );
}

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
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 tracking-tight">
            LLM Model Battle
          </h1>
          <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
        </div>
      </div>

      <ModelSelector modelA={modelA} modelB={modelB} />

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
            <CostComparisonCard models={comparisonData.models} />

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

            {/* Error Rate Card */}
            <MetricComparisonCard
              models={comparisonData.models}
              title="Error Rate"
              subtitle="Percentage of failed requests"
              metricKey="errorRate"
              metricPath="requestStatus.errorRate"
            />
          </>
        )
      )}
    </div>
  );
}

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

            <MetricComparisonCard
              models={comparisonData.models}
              title="Success Rate"
              subtitle="Percentage of successful requests"
              metricKey="successRate"
              metricPath="requestStatus.successRate"
            />

            {/* User Feedback Card */}
            <MetricComparisonCard
              models={comparisonData.models}
              title="User Feedback"
              subtitle="Percentage of positive user feedback"
              metricKey="positivePercentage"
              metricPath="feedback.positivePercentage"
            />

            {/* Negative Feedback Card */}
            <MetricComparisonCard
              models={comparisonData.models}
              title="Negative Feedback"
              subtitle="Percentage of negative user feedback"
              metricKey="negativePercentage"
              metricPath="feedback.negativePercentage"
            />

            {/* Positive Feedback Count Card */}
            <MetricComparisonCard
              models={comparisonData.models}
              title="Positive Feedback Count"
              subtitle="Number of positive user feedback"
              metricKey="positiveFeedbackCount"
              metricPath="feedback.positiveFeedbackCount"
            />

            {/* Negative Feedback Count Card */}
            <MetricComparisonCard
              models={comparisonData.models}
              title="Negative Feedback Count"
              subtitle="Number of negative user feedback"
              metricKey="negativeFeedbackCount"
              metricPath="feedback.negativeFeedbackCount"
            />
          </>
        )
      )}
    </div>
  );
}

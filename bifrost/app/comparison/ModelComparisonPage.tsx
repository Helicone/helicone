"use client";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import ModelTimeSeriesChart from "./ModelTimeSeriesChart";
import ModelSelector from "./ModelSelector";
import ModelComparisonTable from "./ModelComparisonTable";
import GeographicMetricSection from "./GeographicMetricSection";
import CostComparisonCard from "./CostComparisonCard";
import LoadingCard from "./LoadingCard";
import FeedbackCard from "./FeedbackCard";
import { ModelDetails, ModelDetailsMap } from "@/packages/cost/interfaces/Cost";
import ModelInfoCard from "./ModelInfoCard";

export function ModelComparisonPage({
  modelA,
  providerA,
  modelADetails,
  modelB,
  providerB,
  modelBDetails,
}: {
  modelA: string;
  providerA: string;
  modelADetails?: ModelDetails;
  modelB: string;
  providerB: string;
  modelBDetails?: ModelDetails;
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
  const [selectedModelA, setSelectedModelA] = useState(modelA);
  const [selectedModelB, setSelectedModelB] = useState(modelB);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex-col justify-start items-center gap-6 flex mb-8">
        <div className="w-[102.25px] h-[104.50px] relative">
          {/* Logo/Icon components */}
        </div>
        <div className="text-center text-black text-4xl font-semibold font-['Inter'] leading-[47.28px]">
          LLM Leaderboard
        </div>
        <div className="w-[600px] text-center text-slate-700 text-[17px] font-normal font-['Inter'] leading-normal">
          Compare LLM performance with industry benchmarks, a model selection
          framework and insights powered by Helicone.
        </div>
      </div>

      <div className="w- mx-auto">
        <ModelSelector
          modelA={modelA}
          modelB={modelB}
          providerA={providerA}
          providerB={providerB}
          setModelA={setSelectedModelA}
          setModelB={setSelectedModelB}
        />
        <div className="justify-start items-start gap-6 inline-flex mt-6">
          <ModelInfoCard
            modelDetails={modelADetails}
            title={`${modelA} overview`}
          />
          <ModelInfoCard
            modelDetails={modelBDetails}
            title={`${modelB} overview`}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingCard />
      ) : (
        comparisonData?.models && (
          <div className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CostComparisonCard models={comparisonData.models} />
              <FeedbackCard models={comparisonData.models} />
            </div>

            <Card>
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

            <Card>
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
            {/* 
            <MetricComparisonCard
              models={comparisonData.models}
              title="Success Rate"
              subtitle="Percentage of successful requests (200s vs 500s)"
              metricKey="successRate"
              metricPath="requestStatus.successRate"
              higherIsBetter={true}
            /> */}
          </div>
        )
      )}
    </div>
  );
}

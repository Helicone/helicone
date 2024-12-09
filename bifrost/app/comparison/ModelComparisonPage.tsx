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
import { ModelDetails } from "@/packages/cost/interfaces/Cost";
import ModelInfoCard from "./ModelInfoCard";
import Image from "next/image";
import ModelCapabilitiesCard from "./ModelCapabilitiesCard";
import RelatedComparisons from "./RelatedComparisons";

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
  const { data: models, isLoading } = useQuery({
    queryKey: ["modelComparison", modelA, modelB],
    queryFn: async () => {
      const response = await jawnClient.POST("/v1/public/compare/models", {
        body: [
          {
            parent: modelA,
            names: modelADetails?.matches ?? [],
            provider: providerA,
          },
          {
            parent: modelB,
            names: modelBDetails?.matches ?? [],
            provider: providerB,
          },
        ],
      });
      return response.data?.data ?? null;
    },
  });

  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex-col justify-start items-center gap-6 flex mb-8">
          <div>
            <Image
              src="/static/comparison/browser.png"
              alt="LLM Leaderboard"
              width={150}
              height={150}
            />
          </div>
          <div className="text-center">
            <span className="text-black text-4xl font-semibold font-['Inter'] leading-[47.28px]">
              {providerA}{" "}
            </span>
            <span className="text-[#0da5e8] text-4xl font-semibold font-['Inter'] leading-[47.28px]">
              {modelA}{" "}
            </span>
            <span className="text-black text-4xl font-semibold font-['Inter'] leading-[47.28px]">
              vs. <br />
              {providerB}{" "}
            </span>
            <span className="text-[#0da5e8] text-4xl font-semibold font-['Inter'] leading-[47.28px]">
              {modelB}
            </span>
          </div>
          <div className="w-[600px] text-center text-slate-400 text-[16px] font-normal font-['Inter'] leading-normal">
            Compare LLM performance using{" "}
            <span className="text-[#0da5e8]">real-world</span> data from
            thousands of applications. See actual latency, costs, and user
            feedback powered by Helicone.ai.
          </div>
        </div>

        {isLoading ? (
          <LoadingCard />
        ) : (
          models && (
            <div className="grid grid-cols-1 gap-8">
              <div className="max-w-5xl mx-auto">
                <ModelSelector
                  modelA={modelA}
                  modelB={modelB}
                  providerA={providerA}
                  providerB={providerB}
                />
                <div className="flex flex-col md:flex-row justify-between mt-6 gap-8">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CostComparisonCard models={models} />
                <FeedbackCard models={models} />
              </div>

              <Card>
                <div className="flex flex-col">
                  <CardContent className="p-0">
                    <ModelComparisonTable
                      models={models}
                      metric="latency"
                      title="Latency"
                      subtitle="per 1000 tokens"
                    />
                  </CardContent>
                  <div className="h-[400px] border-t p-2 md:p-6">
                    <ModelTimeSeriesChart models={models} metric="latency" />
                  </div>
                  <GeographicMetricSection
                    models={models}
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
                      models={models}
                      metric="ttft"
                      title="Time to First Token"
                      subtitle="milliseconds"
                    />
                  </CardContent>
                  <div className="h-[400px] border-t p-2 md:p-6">
                    <ModelTimeSeriesChart models={models} metric="ttft" />
                  </div>
                  <GeographicMetricSection
                    models={models}
                    selectedModelIndex={selectedModelIndex}
                    onModelSelect={setSelectedModelIndex}
                    metric="ttft"
                  />
                </div>
              </Card>
              <ModelCapabilitiesCard
                modelA={modelA}
                providerA={providerA}
                modelB={modelB}
                providerB={providerB}
                modelDetailsA={modelADetails}
                modelDetailsB={modelBDetails}
              />

              <a
                href="https://helicone.ai/signup"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/static/comparison/dashboard_bottom.webp"
                  alt="LLM Leaderboard"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto"
                />
              </a>
            </div>
          )
        )}
      </div>
    </div>
  );
}

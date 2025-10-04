"use client";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import ModelTimeSeriesChart from "./ModelTimeSeriesChart";
import ModelComparisonTable from "./ModelComparisonTable";
import LoadingCard from "./LoadingCard";
import { ModelDetails } from "@helicone-package/cost/interfaces/Cost";
import Image from "next/image";
import ModelCapabilitiesCard from "./ModelCapabilitiesCard";
import { findModelById } from "@/lib/models/registry";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Globe, LineChart } from "lucide-react";
import { GeoMetricMap } from "./GeoLatencyMap";

function DirectComparisonCard({
  modelA,
  modelB,
  modelADetails,
  modelBDetails,
  modelALogo,
  modelBLogo,
  models,
}: {
  modelA: string;
  modelB: string;
  modelADetails?: ModelDetails;
  modelBDetails?: ModelDetails;
  modelALogo: string;
  modelBLogo: string;
  models: any[];
}) {
  if (!modelADetails || !modelBDetails || !models || models.length < 2)
    return null;

  const formatCost = (cost: number) => {
    if (!cost) return "N/A";
    const costPerMillion = cost * 1000000;

    if (costPerMillion >= 100) {
      return `$${costPerMillion.toFixed(0)}`;
    } else if (costPerMillion >= 10) {
      return `$${costPerMillion.toFixed(1)}`;
    } else {
      return `$${costPerMillion.toFixed(2)}`;
    }
  };

  const renderBenchmarkBar = (score: number | undefined, better: boolean) => {
    if (!score) return null;
    const percentage = score * 100;
    const color = better ? "bg-green-400" : "bg-sky-400";

    return (
      <div className="h-1 w-full bg-gray-100 rounded-full">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const compareMetric = (
    metricA: number | undefined,
    metricB: number | undefined,
  ) => {
    if (!metricA || !metricB) return "none";
    return metricA > metricB ? "A" : "B";
  };

  const betterBenchmarks = {
    mmlu: compareMetric(
      modelADetails.info.benchmarks?.mmlu,
      modelBDetails.info.benchmarks?.mmlu,
    ),
    hellaswag: compareMetric(
      modelADetails.info.benchmarks?.hellaswag,
      modelBDetails.info.benchmarks?.hellaswag,
    ),
    bbh: compareMetric(
      modelADetails.info.benchmarks?.bbh,
      modelBDetails.info.benchmarks?.bbh,
    ),
  };

  const betterCosts = {
    input:
      compareMetric(
        models[0].costs.prompt_token,
        models[1].costs.prompt_token,
      ) === "A"
        ? "B"
        : "A",
    output:
      compareMetric(
        models[0].costs.completion_token,
        models[1].costs.completion_token,
      ) === "A"
        ? "B"
        : "A",
    total:
      compareMetric(
        models[0].costs.prompt_token + models[0].costs.completion_token,
        models[1].costs.prompt_token + models[1].costs.completion_token,
      ) === "A"
        ? "B"
        : "A",
  };

  const betterFeedback = compareMetric(
    models[0].feedback?.positivePercentage,
    models[1].feedback?.positivePercentage,
  );

  return (
    <Card className="w-full">
      <div className="grid grid-cols-12 border-b p-6">
        <div className="col-span-3">
          <h3 className="text-lg font-medium text-slate-700">Comparison</h3>
        </div>
        <div className="col-span-4 flex items-center">
          <img
            src={modelALogo}
            alt={modelA}
            className="w-6 h-6 rounded-full mr-2"
          />
          <h3 className="text-lg font-semibold">{modelA}</h3>
        </div>
        <div className="col-span-4 flex items-center">
          <img
            src={modelBLogo}
            alt={modelB}
            className="w-6 h-6 rounded-full mr-2"
          />
          <h3 className="text-lg font-semibold">{modelB}</h3>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-12 mb-6">
          <div className="col-span-3">
            <h4 className="text-sm font-medium text-slate-600">Description</h4>
          </div>
          <div className="col-span-4 text-sm pr-4">
            <p>{modelADetails.info.description}</p>
          </div>
          <div className="col-span-4 text-sm">
            <p>{modelBDetails.info.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 mb-6">
          <div className="col-span-3">
            <h4 className="text-sm font-medium text-slate-600">Release Date</h4>
          </div>
          <div className="col-span-4 text-sm font-medium">
            {modelADetails.info.releaseDate || "N/A"}
          </div>
          <div className="col-span-4 text-sm font-medium">
            {modelBDetails.info.releaseDate || "N/A"}
          </div>
        </div>

        <div className="grid grid-cols-12 mb-6">
          <div className="col-span-3">
            <h4 className="text-sm font-medium text-slate-600">Max Tokens</h4>
          </div>
          <div className="col-span-4 text-sm font-medium">
            {modelADetails.info.maxTokens?.toLocaleString() || "N/A"}
          </div>
          <div className="col-span-4 text-sm font-medium">
            {modelBDetails.info.maxTokens?.toLocaleString() || "N/A"}
          </div>
        </div>

        {models[0].feedback && models[1].feedback && (
          <div className="grid grid-cols-12 mb-8">
            <div className="col-span-3">
              <h4 className="text-sm font-medium text-slate-600">
                User Satisfaction
              </h4>
            </div>
            <div className="col-span-4">
              <div className="flex items-center">
                <span
                  className={`text-lg font-bold ${
                    betterFeedback === "A" ? "text-green-600" : "text-slate-700"
                  }`}
                >
                  {(models[0].feedback.positivePercentage * 100).toFixed(1)}%
                </span>
                {betterFeedback === "A" && (
                  <span className="text-xs text-green-600 ml-1">Higher</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1">
                <div
                  className={`h-full rounded-full ${
                    betterFeedback === "A" ? "bg-green-500" : "bg-sky-400"
                  }`}
                  style={{
                    width: `${models[0].feedback.positivePercentage * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="col-span-4">
              <div className="flex items-center">
                <span
                  className={`text-lg font-bold ${
                    betterFeedback === "B" ? "text-green-600" : "text-slate-700"
                  }`}
                >
                  {(models[1].feedback.positivePercentage * 100).toFixed(1)}%
                </span>
                {betterFeedback === "B" && (
                  <span className="text-xs text-green-600 ml-1">Higher</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1">
                <div
                  className={`h-full rounded-full ${
                    betterFeedback === "B" ? "bg-green-500" : "bg-sky-400"
                  }`}
                  style={{
                    width: `${models[1].feedback.positivePercentage * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="grid grid-cols-12 mb-2">
            <div className="col-span-3">
              <h4 className="text-sm font-medium text-slate-600">
                Cost (per 1M tokens)
              </h4>
            </div>
            <div className="col-span-4"></div>
            <div className="col-span-4"></div>
          </div>

          <div className="grid grid-cols-12 mb-2">
            <div className="col-span-3 pl-4 text-sm text-slate-500">Input</div>
            <div className="col-span-4">
              <p
                className={`text-sm font-medium ${
                  betterCosts.input === "A" ? "text-green-600" : ""
                }`}
              >
                {formatCost(models[0].costs.prompt_token)}
                {betterCosts.input === "A" && (
                  <span className="text-xs text-green-600 ml-1">Cheaper</span>
                )}
              </p>
            </div>
            <div className="col-span-4">
              <p
                className={`text-sm font-medium ${
                  betterCosts.input === "B" ? "text-green-600" : ""
                }`}
              >
                {formatCost(models[1].costs.prompt_token)}
                {betterCosts.input === "B" && (
                  <span className="text-xs text-green-600 ml-1">Cheaper</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 mb-2">
            <div className="col-span-3 pl-4 text-sm text-slate-500">Output</div>
            <div className="col-span-4">
              <p
                className={`text-sm font-medium ${
                  betterCosts.output === "A" ? "text-green-600" : ""
                }`}
              >
                {formatCost(models[0].costs.completion_token)}
                {betterCosts.output === "A" && (
                  <span className="text-xs text-green-600 ml-1">Cheaper</span>
                )}
              </p>
            </div>
            <div className="col-span-4">
              <p
                className={`text-sm font-medium ${
                  betterCosts.output === "B" ? "text-green-600" : ""
                }`}
              >
                {formatCost(models[1].costs.completion_token)}
                {betterCosts.output === "B" && (
                  <span className="text-xs text-green-600 ml-1">Cheaper</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-3 pl-4 text-sm text-slate-500">Total</div>
            <div className="col-span-4">
              <p
                className={`text-sm font-medium ${
                  betterCosts.total === "A" ? "text-green-600" : ""
                }`}
              >
                {formatCost(
                  models[0].costs.prompt_token +
                    models[0].costs.completion_token,
                )}
                {betterCosts.total === "A" && (
                  <span className="text-xs text-green-600 ml-1">Cheaper</span>
                )}
              </p>
            </div>
            <div className="col-span-4">
              <p
                className={`text-sm font-medium ${
                  betterCosts.total === "B" ? "text-green-600" : ""
                }`}
              >
                {formatCost(
                  models[1].costs.prompt_token +
                    models[1].costs.completion_token,
                )}
                {betterCosts.total === "B" && (
                  <span className="text-xs text-green-600 ml-1">Cheaper</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-12 mb-2">
            <div className="col-span-3">
              <h4 className="text-sm font-medium text-slate-600">
                Benchmark Performance
              </h4>
            </div>
            <div className="col-span-4"></div>
            <div className="col-span-4"></div>
          </div>

          <div className="grid grid-cols-12 mb-3">
            <div className="col-span-3 pl-4 text-sm text-slate-500">MMLU</div>
            <div className="col-span-4">
              <div className="mb-1">
                <span
                  className={`text-sm font-medium ${
                    betterBenchmarks.mmlu === "A" ? "text-green-600" : ""
                  }`}
                >
                  {modelADetails.info.benchmarks?.mmlu
                    ? `${(modelADetails.info.benchmarks.mmlu * 100).toFixed(
                        1,
                      )}%`
                    : "-"}
                  {betterBenchmarks.mmlu === "A" && (
                    <span className="text-xs text-green-600 ml-1">Higher</span>
                  )}
                </span>
              </div>
              {renderBenchmarkBar(
                modelADetails.info.benchmarks?.mmlu,
                betterBenchmarks.mmlu === "A",
              )}
            </div>
            <div className="col-span-4">
              <div className="mb-1">
                <span
                  className={`text-sm font-medium ${
                    betterBenchmarks.mmlu === "B" ? "text-green-600" : ""
                  }`}
                >
                  {modelBDetails.info.benchmarks?.mmlu
                    ? `${(modelBDetails.info.benchmarks.mmlu * 100).toFixed(
                        1,
                      )}%`
                    : "-"}
                  {betterBenchmarks.mmlu === "B" && (
                    <span className="text-xs text-green-600 ml-1">Higher</span>
                  )}
                </span>
              </div>
              {renderBenchmarkBar(
                modelBDetails.info.benchmarks?.mmlu,
                betterBenchmarks.mmlu === "B",
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 mb-3">
            <div className="col-span-3 pl-4 text-sm text-slate-500">
              HellaSwag
            </div>
            <div className="col-span-4">
              <div className="mb-1">
                <span
                  className={`text-sm font-medium ${
                    betterBenchmarks.hellaswag === "A" ? "text-green-600" : ""
                  }`}
                >
                  {modelADetails.info.benchmarks?.hellaswag
                    ? `${(
                        modelADetails.info.benchmarks.hellaswag * 100
                      ).toFixed(1)}%`
                    : "-"}
                  {betterBenchmarks.hellaswag === "A" && (
                    <span className="text-xs text-green-600 ml-1">Higher</span>
                  )}
                </span>
              </div>
              {renderBenchmarkBar(
                modelADetails.info.benchmarks?.hellaswag,
                betterBenchmarks.hellaswag === "A",
              )}
            </div>
            <div className="col-span-4">
              <div className="mb-1">
                <span
                  className={`text-sm font-medium ${
                    betterBenchmarks.hellaswag === "B" ? "text-green-600" : ""
                  }`}
                >
                  {modelBDetails.info.benchmarks?.hellaswag
                    ? `${(
                        modelBDetails.info.benchmarks.hellaswag * 100
                      ).toFixed(1)}%`
                    : "-"}
                  {betterBenchmarks.hellaswag === "B" && (
                    <span className="text-xs text-green-600 ml-1">Higher</span>
                  )}
                </span>
              </div>
              {renderBenchmarkBar(
                modelBDetails.info.benchmarks?.hellaswag,
                betterBenchmarks.hellaswag === "B",
              )}
            </div>
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-3 pl-4 text-sm text-slate-500">BBH</div>
            <div className="col-span-4">
              <div className="mb-1">
                <span
                  className={`text-sm font-medium ${
                    betterBenchmarks.bbh === "A" ? "text-green-600" : ""
                  }`}
                >
                  {modelADetails.info.benchmarks?.bbh
                    ? `${(modelADetails.info.benchmarks.bbh * 100).toFixed(1)}%`
                    : "-"}
                  {betterBenchmarks.bbh === "A" && (
                    <span className="text-xs text-green-600 ml-1">Higher</span>
                  )}
                </span>
              </div>
              {renderBenchmarkBar(
                modelADetails.info.benchmarks?.bbh,
                betterBenchmarks.bbh === "A",
              )}
            </div>
            <div className="col-span-4">
              <div className="mb-1">
                <span
                  className={`text-sm font-medium ${
                    betterBenchmarks.bbh === "B" ? "text-green-600" : ""
                  }`}
                >
                  {modelBDetails.info.benchmarks?.bbh
                    ? `${(modelBDetails.info.benchmarks.bbh * 100).toFixed(1)}%`
                    : "-"}
                  {betterBenchmarks.bbh === "B" && (
                    <span className="text-xs text-green-600 ml-1">Higher</span>
                  )}
                </span>
              </div>
              {renderBenchmarkBar(
                modelBDetails.info.benchmarks?.bbh,
                betterBenchmarks.bbh === "B",
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-12 mb-2">
            <div className="col-span-3">
              <h4 className="text-sm font-medium text-slate-600">Best For</h4>
            </div>
            <div className="col-span-4">
              <div className="space-y-1">
                {modelADetails.info.recommendations
                  .slice(0, 3)
                  .map((rec, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-slate-600">{rec}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="col-span-4">
              <div className="space-y-1">
                {modelBDetails.info.recommendations
                  .slice(0, 3)
                  .map((rec, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-slate-600">{rec}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

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

  const modelAInfo = findModelById(modelA);
  const modelBInfo = findModelById(modelB);

  const modelALogo = modelAInfo?.provider.logo || `/static/home/logo4.webp`;
  const modelBLogo = modelBInfo?.provider.logo || `/static/home/logo4.webp`;

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
                <DirectComparisonCard
                  modelA={modelA}
                  modelB={modelB}
                  modelADetails={modelADetails}
                  modelBDetails={modelBDetails}
                  modelALogo={modelALogo}
                  modelBLogo={modelBLogo}
                  models={models}
                />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 border-t">
                    {/* Geographic Map Section - Left Side */}
                    <div className="border-r">
                      <div className="p-3 border-b bg-gray-50 flex justify-between items-center h-12">
                        <h3 className="text-sm font-medium text-slate-700">
                          Region Comparison
                        </h3>
                        <div className="flex gap-1">
                          {models.map((model, index) => (
                            <button
                              key={model.model}
                              onClick={() => setSelectedModelIndex(index)}
                              className={`text-xs px-2 py-1 rounded ${
                                selectedModelIndex === index
                                  ? "bg-blue-100 text-blue-700 font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {model.model.includes("-")
                                ? model.model.split("-").slice(0, 2).join("-")
                                : model.model}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 h-[320px] relative overflow-hidden">
                        <GeoMetricMap
                          model={models[selectedModelIndex] ?? null}
                          metric="latency"
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    {/* Time Series Chart - Right Side */}
                    <div>
                      <div className="p-3 border-b bg-gray-50 flex justify-between items-center h-12">
                        <h3 className="text-sm font-medium text-slate-700">
                          30-Day Trend
                        </h3>
                        <div className="flex items-center text-xs text-slate-500">
                          <span>Historical data</span>
                        </div>
                      </div>
                      <div className="p-4 h-[320px]">
                        <ModelTimeSeriesChart
                          models={models}
                          metric="latency"
                        />
                      </div>
                    </div>
                  </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 border-t">
                    {/* Geographic Map Section - Left Side */}
                    <div className="border-r">
                      <div className="p-3 border-b bg-gray-50 flex justify-between items-center h-12">
                        <h3 className="text-sm font-medium text-slate-700">
                          Region Comparison
                        </h3>
                        <div className="flex gap-1">
                          {models.map((model, index) => (
                            <button
                              key={model.model}
                              onClick={() => setSelectedModelIndex(index)}
                              className={`text-xs px-2 py-1 rounded ${
                                selectedModelIndex === index
                                  ? "bg-blue-100 text-blue-700 font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {model.model.includes("-")
                                ? model.model.split("-").slice(0, 2).join("-")
                                : model.model}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 h-[320px] relative overflow-hidden">
                        <GeoMetricMap
                          model={models[selectedModelIndex] ?? null}
                          metric="ttft"
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    {/* Time Series Chart - Right Side */}
                    <div>
                      <div className="p-3 border-b bg-gray-50 flex justify-between items-center h-12">
                        <h3 className="text-sm font-medium text-slate-700">
                          30-Day Trend
                        </h3>
                        <div className="flex items-center text-xs text-slate-500">
                          <span>Historical data</span>
                        </div>
                      </div>
                      <div className="p-4 h-[320px]">
                        <ModelTimeSeriesChart models={models} metric="ttft" />
                      </div>
                    </div>
                  </div>
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

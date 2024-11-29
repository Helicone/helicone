"use client";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
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

const renderModelHeader = (model: components["schemas"]["Model"]) => (
  <Card className="shadow-none border">
    <CardHeader className="pb-2">
      <CardTitle className="text-[32px] font-semibold opacity-80 text-center">
        {model.model}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Badge
        variant="secondary"
        className="bg-blue-50 text-blue-700 hover:bg-blue-50 mb-4"
      >
        {model.provider}
      </Badge>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-[12px] font-semibold opacity-80">
            Success Rate
          </div>
          <div className="text-[18px] font-semibold opacity-80">
            {(model.requestStatus.successRate * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold opacity-80">Input Cost</div>
          <div className="text-[18px] font-semibold opacity-80">
            ${model.cost.input.toFixed(2)}/1k
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold opacity-80">
            Output Cost
          </div>
          <div className="text-[18px] font-semibold opacity-80">
            ${model.cost.output.toFixed(2)}/1k
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const renderMetricStats = (stats: any, title: string) => (
  <Card className="shadow-none border">
    <CardHeader>
      <CardTitle className="text-[24px] font-semibold opacity-80 text-center">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-[12px] font-semibold opacity-80">Average</div>
          <div className="text-[18px] font-semibold opacity-80">
            {Math.round(stats.average)}ms
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold opacity-80">P95</div>
          <div className="text-[18px] font-semibold opacity-80">
            {Math.round(stats.p95)}ms
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold opacity-80">Median</div>
          <div className="text-[18px] font-semibold opacity-80">
            {Math.round(stats.median)}ms
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold opacity-80">Min</div>
          <div className="text-[18px] font-semibold opacity-80">
            {Math.round(Number(stats.min))}ms
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold opacity-80">Max</div>
          <div className="text-[18px] font-semibold opacity-80">
            {Math.round(Number(stats.max))}ms
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold opacity-80">P99</div>
          <div className="text-[18px] font-semibold opacity-80">
            {Math.round(stats.p99)}ms
          </div>
        </div>
      </div>
      {"averagePerCompletionToken" in stats && (
        <div className="mt-4 border-t pt-4">
          <div className="text-[12px] font-semibold opacity-80">
            Per Token Average
          </div>
          <div className="text-[18px] font-semibold opacity-80">
            {stats.averagePerCompletionToken.toFixed(2)}ms
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export function ModelComparisonPage({
  modelA,
  modelB,
}: {
  modelA: string;
  modelB: string;
}) {
  const jawnClient = useJawnClient();
  const [comparisonData, setComparisonData] = useState<
    components["schemas"]["ModelComparison"] | null
  >(null);
  const [isLoading, setIsLoading] = useState({ comparison: true });
  const [error, setError] = useState<{ comparison?: string }>({});
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  useEffect(() => {
    async function fetchComparisonData() {
      setIsLoading((prev) => ({ ...prev, comparison: true }));
      try {
        const response = await jawnClient.POST("/v1/public/compare/models", {
          body: {
            modelA,
            modelB,
          },
        });
        setComparisonData(response.data?.data ?? null);
      } catch (error) {
        console.error("Failed to fetch comparison:", error);
        setError((prev) => ({
          ...prev,
          comparison: "Failed to load comparison data",
        }));
      } finally {
        setIsLoading((prev) => ({ ...prev, comparison: false }));
      }
    }

    fetchComparisonData();
  }, [modelA, modelB]);

  const renderModelCard = (model: components["schemas"]["Model"]) => (
    <div className="space-y-4">
      {renderModelHeader(model)}
      {renderMetricStats(model.latency, "Latency")}
      {renderMetricStats(model.ttft, "Time to First Token")}
    </div>
  );

  return (
    <TooltipProvider>
      <div>
        <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto p-4 pb-[80px]">
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <div className="text-gray-500 font-semibold text-[14px] mb-6">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <h1 className="text-[48px] font-semibold opacity-80 text-center">
              MODEL COMPARISON
            </h1>
            <p className="text-[18px] font-semibold opacity-80 text-center">
              <span className="tracking-[4px]">{modelA}</span>
              <span className="mx-4 tracking-[12px]">vs</span>
              <span className="tracking-[4px]">{modelB}</span>
            </p>
          </div>

          {isLoading.comparison ? (
            <div className="text-center py-8">Loading comparison data...</div>
          ) : error.comparison ? (
            <div className="text-red-500 text-center py-8">
              {error.comparison}
            </div>
          ) : comparisonData?.models ? (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {comparisonData.models.map((model) => renderModelCard(model))}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#4ADEEB] flex items-center gap-2">
                    Geographic Latency
                    <span className="text-sm font-normal text-gray-400">
                      Average latency by region
                    </span>
                  </h2>
                  <div className="flex gap-1 p-0.5 bg-[#1E293B]/50 rounded-lg">
                    {comparisonData.models.map((model, index) => (
                      <button
                        key={model.model}
                        onClick={() => setSelectedModelIndex(index)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          selectedModelIndex === index
                            ? "bg-[#2A4F7E] text-[#4ADEEB] shadow-sm"
                            : "text-gray-300 hover:text-[#4ADEEB] hover:bg-[#2A4F7E]/20"
                        }`}
                      >
                        {model.model}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full">
                  <GeographicLatencyMap
                    model={comparisonData.models[selectedModelIndex]}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">No comparison data available</div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

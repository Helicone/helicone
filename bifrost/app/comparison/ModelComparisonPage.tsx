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

const geoUrl = "https://d3js.org/world-atlas@2.0.2/countries-50m.json";
const renderModelHeader = (model: components["schemas"]["Model"]) => (
  <Card className="shadow-none border">
    <CardHeader className="pb-2">
      <CardTitle className="text-2xl font-bold">{model.model}</CardTitle>
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
          <div className="text-muted-foreground">Success Rate</div>
          <div className="font-medium text-lg">
            {(model.requestStatus.successRate * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Input Cost</div>
          <div className="font-medium text-lg">
            ${model.cost.input.toFixed(2)}/1k
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Output Cost</div>
          <div className="font-medium text-lg">
            ${model.cost.output.toFixed(2)}/1k
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const renderMetricStats = (
  stats:
    | components["schemas"]["TokenMetricStats"]
    | components["schemas"]["MetricStats"],
  title: string
) => (
  <Card className="shadow-none border">
    <CardHeader>
      <CardTitle className="text-xl font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-muted-foreground mb-1">Average</div>
          <div className="font-medium text-lg">
            {Math.round(stats.average)}ms
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">P95</div>
          <div className="font-medium text-lg">{Math.round(stats.p95)}ms</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">Median</div>
          <div className="font-medium text-lg">
            {Math.round(stats.median)}ms
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">Min</div>
          <div className="font-medium text-lg">
            {Math.round(Number(stats.min))}ms
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">Max</div>
          <div className="font-medium text-lg">
            {Math.round(Number(stats.max))}ms
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">P99</div>
          <div className="font-medium text-lg">{Math.round(stats.p99)}ms</div>
        </div>
      </div>
      {"averagePerCompletionToken" in stats && (
        <div className="mt-4 border-t pt-4">
          <div className="text-muted-foreground mb-1">Per Token Average</div>
          <div className="font-medium text-lg">
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
  const [tooltipContent, setTooltipContent] = useState("");

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
      <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Model Comparison</h1>
            <p className="text-muted-foreground">
              {modelA} vs {modelB}
            </p>
          </div>
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
                <h2 className="text-xl font-semibold">Geographic Latency</h2>
                <div className="flex gap-2">
                  {comparisonData.models.map((model, index) => (
                    <button
                      key={model.model}
                      onClick={() => setSelectedModelIndex(index)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        selectedModelIndex === index
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
                  setTooltipContent={setTooltipContent}
                />
                {tooltipContent && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {tooltipContent}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tooltipContent}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">No comparison data available</div>
        )}
      </div>
    </TooltipProvider>
  );
}

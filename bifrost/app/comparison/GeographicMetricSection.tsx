import { Button } from "@/components/ui/button";
import { GeoMetricMap } from "./GeoMetricMap";
import { components } from "@/lib/clients/jawnTypes/public";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type MetricType = "latency" | "ttft";

interface GeographicMetricSectionProps {
  models: components["schemas"]["Model"][];
  selectedModelIndex: number;
  onModelSelect: (index: number) => void;
  metric: MetricType;
}

const metricTitles = {
  latency: "Average Latency by Region",
  ttft: "Time to First Token by Region",
};

const GeographicMetricSection = ({
  models,
  selectedModelIndex,
  onModelSelect,
  metric,
}: GeographicMetricSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold">{metricTitles[metric]}</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded
            ? "max-h-[800px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-4">
          <div className="inline-flex rounded-md bg-gray-50 p-1 w-full sm:w-auto">
            {models.map((model, index) => (
              <Button
                key={model.model}
                variant="ghost"
                onClick={() => onModelSelect(index)}
                className={`rounded-sm text-sm px-4 flex-1 sm:flex-initial whitespace-normal h-auto py-2 ${
                  selectedModelIndex === index
                    ? "bg-white text-black shadow-sm"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {model.model}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-full p-4">
          <GeoMetricMap
            model={models[selectedModelIndex] ?? null}
            metric={metric}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default GeographicMetricSection;

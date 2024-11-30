import { Card, CardContent } from "@/components/ui/card";
import ModelTimeSeriesChart from "./ModelTimeSeriesChart";
import { components } from "@/lib/clients/jawnTypes/public";

export type MetricType =
  | "latency"
  | "ttft"
  | "errorRate"
  | "successRate"
  | "positivePercentage"
  | "negativePercentage"
  | "positiveFeedbackCount"
  | "negativeFeedbackCount";

interface MetricComparisonCardProps {
  models: components["schemas"]["Model"][];
  title: string;
  subtitle: string;
  metricKey: MetricType;
  metricPath: string;
  formatValue?: (value: number) => string;
  showTimeSeries?: boolean;
}

export default function MetricComparisonCard({
  models,
  title,
  subtitle,
  metricKey,
  metricPath,
  formatValue = (value) => `${(value * 100).toFixed(5)}%`,
  showTimeSeries = true,
}: MetricComparisonCardProps) {
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  return (
    <Card className="mb-8">
      <div className="flex flex-col">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {models.map((model, index) => {
              const value = getNestedValue(model, metricPath);
              const otherValue = getNestedValue(models[1 - index], metricPath);
              const isWinner = value < otherValue;

              return (
                <div
                  key={model.model}
                  className="flex flex-col p-4 border rounded-lg"
                >
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      isWinner ? "bg-gray-100" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        index === 0 ? "bg-gray-600" : "bg-gray-400"
                      }`}
                    />
                    <div
                      className={`text-sm ${
                        isWinner ? "font-medium" : "text-gray-500"
                      }`}
                    >
                      {model.model}
                      {isWinner && (
                        <span className="text-xs font-medium text-gray-600 ml-1">
                          Winner
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {formatValue(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        {showTimeSeries && (
          <div className="h-[400px] border-t p-2 md:p-6">
            <ModelTimeSeriesChart models={models} metric={metricKey} />
          </div>
        )}
      </div>
    </Card>
  );
}

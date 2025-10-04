import { components } from "@/lib/clients/jawnTypes/public";
import { formatLatency } from "../utils/formattingUtils";
import { BarChart2, InfoIcon } from "lucide-react";

export interface ModelComparisonTableProps {
  models: components["schemas"]["Model"][];
  metric: "latency" | "ttft";
  title: string;
  subtitle: string;
}

const ModelComparisonTable = ({
  models,
  metric,
  title,
  subtitle,
}: ModelComparisonTableProps) => {
  const getWinnerIndex = (metric: number[]) => {
    return metric.indexOf(Math.min(...metric));
  };

  const medianWinner = getWinnerIndex(models.map((m) => m[metric].median));

  // Calculate percentage differences
  const calculatePercentDiff = (winnerValue: number, compareValue: number) => {
    if (winnerValue === 0) return 0;
    return ((compareValue - winnerValue) / winnerValue) * 100;
  };

  return (
    <div className="px-6 pt-4 pb-2">
      <div className="flex items-center mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-medium text-gray-800">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <InfoIcon className="w-3 h-3 mr-1" />
          <span>
            Lower is better. Percentages show difference from fastest.
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-6 text-sm font-medium text-gray-500">
                Model
              </th>
              <th className="text-left py-2 px-6 text-sm font-medium text-gray-500 w-1/4">
                <div className="flex items-center gap-1">
                  <span>Median</span>
                  <BarChart2 className="w-3 h-3 text-blue-500" />
                </div>
              </th>
              <th className="text-left py-2 px-6 text-sm font-medium text-gray-500">
                p90
              </th>
              <th className="text-left py-2 px-6 text-sm font-medium text-gray-500 w-1/4">
                95th Percentile
              </th>
              <th className="text-left py-2 px-6 text-sm font-medium text-gray-500">
                p99
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => {
              const isWinner = index === medianWinner;

              // Check if the model, metric data exists before calculating
              const canCalculatePercentages =
                isWinner === false &&
                models[medianWinner] &&
                models[medianWinner][metric] &&
                model[metric] &&
                typeof models[medianWinner][metric].median === "number" &&
                typeof model[metric].median === "number";

              const percentDiffs = !canCalculatePercentages
                ? null
                : {
                    median: calculatePercentDiff(
                      models[medianWinner][metric].median,
                      model[metric].median,
                    ),
                    p90: calculatePercentDiff(
                      models[medianWinner][metric].p90,
                      model[metric].p90,
                    ),
                    p95: calculatePercentDiff(
                      models[medianWinner][metric].p95,
                      model[metric].p95,
                    ),
                    p99: calculatePercentDiff(
                      models[medianWinner][metric].p99,
                      model[metric].p99,
                    ),
                  };

              return (
                <tr
                  key={model.model}
                  className={
                    isWinner
                      ? "bg-blue-50"
                      : index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                  }
                >
                  <td
                    className={`py-3 pr-6 ${
                      isWinner ? "border-l-2 border-blue-500 pl-3" : "pl-4"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 mr-2 rounded-full ${
                          index === 0 ? "bg-red-500" : "bg-blue-500"
                        }`}
                      />
                      <span
                        className={`${
                          isWinner
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {model.model}
                      </span>
                      {isWinner && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs text-blue-700 bg-blue-100 rounded">
                          Fastest
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center">
                      <span className={isWinner ? "font-semibold" : ""}>
                        {formatLatency(model[metric].median)}
                      </span>
                      {!isWinner && percentDiffs && (
                        <span className="text-xs text-red-500 ml-2">
                          +{percentDiffs.median.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center">
                      <span>{formatLatency(model[metric].p90)}</span>
                      {!isWinner && percentDiffs && (
                        <span className="text-xs text-red-500 ml-2">
                          +{percentDiffs.p90.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center">
                      <span>{formatLatency(model[metric].p95)}</span>
                      {!isWinner && percentDiffs && (
                        <span className="text-xs text-red-500 ml-2">
                          +{percentDiffs.p95.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center">
                      <span>{formatLatency(model[metric].p99)}</span>
                      {!isWinner && percentDiffs && (
                        <span className="text-xs text-red-500 ml-2">
                          +{percentDiffs.p99.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModelComparisonTable;

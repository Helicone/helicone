import { components } from "@/lib/clients/jawnTypes/public";
import { formatLatency } from "../utils/formattingUtils";
import { BarChart2 } from "lucide-react";

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

  return (
    <div className="flex-1 overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left py-4 px-6">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-semibold text-gray-900">
                  {title}
                </span>
                <span className="text-xs font-normal text-gray-500 mt-1">
                  {subtitle}
                </span>
              </div>
            </th>
            <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider relative">
              <div className="flex items-center gap-1">
                <span>median</span>
                <BarChart2 className="w-4 h-4 text-purple-500" />
              </div>
            </th>
            <th
              key="average"
              className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider"
            >
              average
            </th>
            <th
              key="p90"
              className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider"
            >
              p90
            </th>
            <th
              key="p95"
              className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider"
            >
              p95
            </th>
            <th
              key="p99"
              className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider"
            >
              p99
            </th>
          </tr>
        </thead>
        <tbody>
          {models.map((model, index) => (
            <tr key={model.model}>
              <td
                className={`py-4 px-6 ${
                  index === medianWinner
                    ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-sm ${
                      index === 0 ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      index === medianWinner
                        ? "font-bold text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    {model.model}
                  </span>
                  {index === medianWinner && (
                    <span className="text-xs font-semibold text-purple-500 ml-1">
                      WINNER
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-6">
                {formatLatency(model[metric].median)}
              </td>
              <td className="py-4 px-6">
                {formatLatency(model[metric].average)}
              </td>
              <td className="py-4 px-6">{formatLatency(model[metric].p90)}</td>
              <td className="py-4 px-6">{formatLatency(model[metric].p95)}</td>
              <td className="py-4 px-6">{formatLatency(model[metric].p99)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ModelComparisonTable;

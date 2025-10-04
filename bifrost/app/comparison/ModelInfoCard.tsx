import { ModelDetails } from "@helicone-package/cost/interfaces/Cost";
import { CheckIcon } from "@heroicons/react/24/outline";

interface ModelInfoCardProps {
  modelDetails?: ModelDetails;
  title: string;
  logo?: string;
  costs?: {
    prompt_token: number;
    completion_token: number;
  };
  feedback?: {
    positivePercentage?: number;
    negativePercentage?: number;
    count?: number;
  };
  isBetterFeedback?: boolean;
}

const ModelInfoCard = ({
  modelDetails,
  title,
  logo,
  costs,
  feedback,
  isBetterFeedback = false,
}: ModelInfoCardProps) => {
  if (!modelDetails) return null;

  // Function to render benchmark bars with color based on score
  const renderBenchmarkBar = (score: number | undefined) => {
    if (!score) return null;
    const percentage = score * 100;

    let color = "bg-sky-400";
    if (percentage >= 90) color = "bg-green-400";
    else if (percentage >= 80) color = "bg-sky-400";
    else if (percentage >= 70) color = "bg-amber-400";
    else color = "bg-red-400";

    return (
      <div className="h-1 w-full bg-gray-100 rounded-full mt-1">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  // Format dollar amounts with appropriate precision
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

  // Calculate total cost if both prompt and completion costs are available
  const totalCost = costs ? costs.prompt_token + costs.completion_token : null;

  // Format feedback percentage
  const positivePercentage = feedback?.positivePercentage
    ? (feedback.positivePercentage * 100).toFixed(1)
    : null;

  return (
    <div className="w-full flex-1 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex gap-3 items-center mb-6">
        {logo && (
          <img
            src={logo}
            alt={`${title} logo`}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <h3 className="text-black text-lg font-semibold">{title}</h3>
      </div>

      {/* Description */}
      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
        {modelDetails.info.description}
      </p>

      {/* Key Details */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <div className="text-slate-400 mb-1">Release Date</div>
          <div className="font-medium">
            {modelDetails.info.releaseDate || "N/A"}
          </div>
        </div>

        <div>
          <div className="text-slate-400 mb-1">Max Tokens</div>
          <div className="font-medium">
            {modelDetails.info.maxTokens?.toLocaleString() || "N/A"}
          </div>
        </div>
      </div>

      {/* Cost Information */}
      {costs && (
        <div className="mb-6">
          <div className="text-slate-600 font-medium mb-2">
            Cost (per 1M tokens)
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Input</div>
              <div className="font-medium">
                {formatCost(costs.prompt_token)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Output</div>
              <div className="font-medium">
                {formatCost(costs.completion_token)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Total</div>
              <div className="font-medium">{formatCost(totalCost || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* User Feedback */}
      {feedback && positivePercentage && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-slate-600 font-medium">User Satisfaction</div>
            {isBetterFeedback && (
              <span className="text-xs text-green-600 font-medium">
                Higher rating
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold text-sky-500">
              {positivePercentage}%
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-full bg-gray-100 rounded-full">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${positivePercentage}%` }}
                />
              </div>
              {feedback.count && (
                <div className="text-xs text-slate-400 mt-1">
                  Based on {feedback.count.toLocaleString()} ratings
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      <div className="mb-6">
        <div className="text-slate-600 font-medium mb-2">
          Benchmark Performance
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">MMLU</span>
              <span className="font-medium">
                {modelDetails.info.benchmarks?.mmlu
                  ? `${(modelDetails.info.benchmarks.mmlu * 100).toFixed(1)}%`
                  : "-"}
              </span>
            </div>
            {renderBenchmarkBar(modelDetails.info.benchmarks?.mmlu)}
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">HellaSwag</span>
              <span className="font-medium">
                {modelDetails.info.benchmarks?.hellaswag
                  ? `${(modelDetails.info.benchmarks.hellaswag * 100).toFixed(
                      1,
                    )}%`
                  : "-"}
              </span>
            </div>
            {renderBenchmarkBar(modelDetails.info.benchmarks?.hellaswag)}
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">BBH</span>
              <span className="font-medium">
                {modelDetails.info.benchmarks?.bbh
                  ? `${(modelDetails.info.benchmarks.bbh * 100).toFixed(1)}%`
                  : "-"}
              </span>
            </div>
            {renderBenchmarkBar(modelDetails.info.benchmarks?.bbh)}
          </div>
        </div>
      </div>

      {/* Recommended for */}
      <div>
        <div className="text-slate-600 font-medium mb-2">Best For</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {modelDetails.info.recommendations
            .slice(0, 4)
            .map((recommendation, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 text-slate-600"
              >
                <CheckIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span>{recommendation}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ModelInfoCard;

import React from "react";
import { EvaluatorStats } from "../hooks/useEvaluatorStats";

interface ScoreDistributionChartProps {
  distributionData: EvaluatorStats["scoreDistribution"];
  className?: string;
}

/**
 * Simple distribution chart to visualize score distribution
 */
export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  distributionData,
  className = "",
}) => {
  // If no data, show a placeholder
  if (!distributionData || distributionData.length === 0) {
    return (
      <div className={`h-24 flex items-center justify-center ${className}`}>
        <p className="text-sm text-muted-foreground">
          No distribution data available
        </p>
      </div>
    );
  }

  // Find the maximum count for scaling
  const maxCount = Math.max(...distributionData.map((item) => item.count));

  return (
    <div className={`h-24 ${className}`}>
      <div className="flex items-end h-full space-x-1">
        {distributionData.map((bucket, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-400 hover:bg-blue-500 rounded-t-sm transition-colors"
              style={{
                height: `${(bucket.count / maxCount) * 100}%`,
                minHeight: bucket.count > 0 ? "4px" : "0",
              }}
              title={`${bucket.range}: ${bucket.count} evaluations`}
            />
            <span className="text-[10px] text-muted-foreground truncate w-full text-center mt-1">
              {bucket.range}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

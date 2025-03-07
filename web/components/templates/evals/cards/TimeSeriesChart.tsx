import React from "react";
import { EvaluatorStats } from "../hooks/useEvaluatorStats";

interface TimeSeriesChartProps {
  timeSeriesData: EvaluatorStats["timeSeriesData"];
  className?: string;
}

/**
 * Simple time series chart component to visualize evaluator score trends
 */
export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  timeSeriesData,
  className = "",
}) => {
  // If no data, show a placeholder
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className={`h-32 flex items-center justify-center ${className}`}>
        <p className="text-sm text-muted-foreground">
          No historical data available
        </p>
      </div>
    );
  }

  // Find min and max values for scaling
  const values = timeSeriesData.map((item) => item.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 100; // Prevent division by zero

  // Format the dates for the x-axis
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className={`h-32 flex flex-col ${className}`}>
      <div className="flex-grow relative">
        {/* Chart area */}
        <div className="absolute inset-0 flex items-end">
          {timeSeriesData.map((point, index) => {
            // Normalize value to a percentage height
            const normalizedHeight = ((point.value - minValue) / range) * 100;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end px-0.5"
              >
                <div
                  className="bg-blue-500 rounded-t-sm"
                  style={{ height: `${Math.max(normalizedHeight, 5)}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground pt-1">
        {timeSeriesData.length > 7 ? (
          // If many data points, show only first, middle, and last
          <>
            <span>{formatDate(timeSeriesData[0].date)}</span>
            <span>
              {formatDate(
                timeSeriesData[Math.floor(timeSeriesData.length / 2)].date
              )}
            </span>
            <span>
              {formatDate(timeSeriesData[timeSeriesData.length - 1].date)}
            </span>
          </>
        ) : (
          // Show all data points if few
          timeSeriesData.map((point, index) => (
            <span key={index}>{formatDate(point.date)}</span>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs pt-2">
        <span className="font-medium">
          Avg: {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}%
        </span>
        <span className="text-muted-foreground">
          Max: {maxValue.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

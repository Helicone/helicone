import React from "react";
import { EvaluatorStats } from "../hooks/useEvaluatorStats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps,
} from "recharts";

interface ScoreDistributionChartProps {
  distributionData: EvaluatorStats["scoreDistribution"];
  className?: string;
}

/**
 * Distribution chart to visualize score distribution using Recharts
 */
export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  distributionData,
  className = "",
}) => {
  // Process the data for charting
  const processedData =
    !distributionData || distributionData.length === 0
      ? generateMockDistributionData()
      : distributionData.map((item) => ({
          range: item.range,
          count: Number(item.count) || 0, // Ensure count is a number
        }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="text-xs font-medium">{`Score range: ${payload[0].payload.range}`}</p>
          <p className="text-xs text-muted-foreground">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`h-24 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
          />
          <Bar
            dataKey="count"
            fill="#0EA5E9" // sky-500 in Tailwind
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Generate mock distribution data for when no real data is available
 */
function generateMockDistributionData() {
  return [
    { range: "0-20", count: 2 },
    { range: "21-40", count: 5 },
    { range: "41-60", count: 8 },
    { range: "61-80", count: 15 },
    { range: "81-100", count: 10 },
  ];
}

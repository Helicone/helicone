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
import { Small } from "@/components/ui/typography";

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
  // Check if we have real data
  const hasData = distributionData && distributionData.length > 0;

  // If no data, show a message instead of chart
  if (!hasData) {
    return (
      <div className={`h-24 flex items-center justify-center ${className}`}>
        <Small className="text-muted-foreground">No data available</Small>
      </div>
    );
  }

  // Process real data for charting
  const processedData = distributionData.map((item) => ({
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

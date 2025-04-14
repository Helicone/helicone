import React from "react";
import { EvaluatorStats } from "../hooks/useEvaluatorStats";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps,
  Dot,
} from "recharts";
import { Small } from "@/components/ui/typography";

interface TimeSeriesChartProps {
  timeSeriesData: EvaluatorStats["timeSeriesData"];
  className?: string;
}

/**
 * Time series chart component to visualize evaluator score trends using Recharts
 */
export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  timeSeriesData,
  className = "",
}) => {
  // Format date helper function (e.g., "2025-02-19" to "2/19")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Check if we have real data
  const hasData = timeSeriesData && timeSeriesData.length > 0;

  // If no data, show a message instead of chart
  if (!hasData) {
    return (
      <div className={`h-32 flex items-center justify-center ${className}`}>
        <Small className="text-muted-foreground">No data available</Small>
      </div>
    );
  }

  // Process real data for the chart
  const chartData = timeSeriesData.map((item) => ({
    date: formatDate(item.date),
    value: Number(item.value) || 0, // Ensure value is a number
  }));

  // Calculate stats for display
  const values = chartData.map((item) => item.value);
  const minScore = values.length > 0 ? Math.min(...values) : 0;
  const maxScore = values.length > 0 ? Math.max(...values) : 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="text-xs font-medium">{`Score: ${payload[0].value?.toFixed(
            1
          )}%`}</p>
          <p className="text-xs text-muted-foreground">{`Date: ${payload[0].payload.date}`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom dot for the line chart
  const CustomDot = (props: any) => {
    const { cx, cy } = props;
    return (
      <Dot cx={cx} cy={cy} r={4} fill="#0284C7" stroke="#fff" strokeWidth={1} />
    );
  };

  return (
    <div className={`h-32 flex flex-col ${className}`}>
      {/* Chart area */}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.2}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={"preserveStartEnd"}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3", stroke: "#94A3B8" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0284C7" // sky-600 in Tailwind
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={<CustomDot />}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs pt-2">
        <Small className="text-muted-foreground">
          Min: {minScore.toFixed(1)}%
        </Small>
        <Small className="text-muted-foreground">
          Max: {maxScore.toFixed(1)}%
        </Small>
      </div>
    </div>
  );
};

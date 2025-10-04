import { AreaChart } from "@tremor/react";
import React from "react";

interface AverageScoreChartProps {
  averageOverTime: { date: string; value: number }[];
}

export const AverageScoreChart: React.FC<AverageScoreChartProps> = ({
  averageOverTime,
}) => (
  <div className="h-16 w-full">
    <AreaChart
      className="h-full"
      data={averageOverTime}
      index="date"
      categories={["value"]}
      colors={["emerald"]}
      showXAxis={false}
      showYAxis={false}
      showLegend={false}
      showTooltip={true}
      showGridLines={false}
      curveType="monotone"
    />
  </div>
);

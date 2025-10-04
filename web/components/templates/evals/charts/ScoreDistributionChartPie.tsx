import { formatNumber } from "@/components/shared/utils/formatNumber";
import { DonutChart } from "@tremor/react";
import React from "react";

interface ScoreDistributionChartProps {
  distribution: { lower: number; upper: number; value: number }[];
}

export const ScoreDistributionChartPie: React.FC<
  ScoreDistributionChartProps
> = ({ distribution }) => (
  <div className="h-16 w-full p-2">
    <DonutChart
      className="h-full"
      data={distribution.map((d) => ({
        name: `${formatNumber(d.lower)} - ${formatNumber(d.upper)}`,
        value: d.value,
      }))}
      category="value"
      index="name"
      colors={["rose", "emerald", "amber", "rose"]}
      showTooltip={true}
      showLabel={false}
      variant="pie"
      valueFormatter={(value) => formatNumber(value)}
    />
  </div>
);

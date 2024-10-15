import { BarChart } from "@tremor/react";

interface ScoreDistributionChartProps {
  distribution: { lower: number; upper: number; value: number }[];
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  distribution,
}) => (
  <div className="w-full h-16">
    <BarChart
      className="h-full"
      data={distribution.map((d) => ({
        range: `${d.lower} - ${d.upper}`,
        count: d.value,
      }))}
      index="range"
      categories={["count"]}
      colors={["violet"]}
      showXAxis={false}
      showYAxis={false}
      showLegend={false}
      showTooltip={true}
      showGridLines={false}
    />
  </div>
);

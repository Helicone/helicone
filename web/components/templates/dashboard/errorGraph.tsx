import { Card, CardContent } from "@/components/ui/card";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import { useMemo } from "react";

interface ErrorPanelProps {
  accumulatedStatusCounts: {
    name: string;
    value: number;
  }[];
  totalRequests?: number;
}

export const ErrorGraph = ({
  accumulatedStatusCounts,
  totalRequests,
}: ErrorPanelProps) => {
  const errorChartConfig = useMemo(() => {
    let config: ChartConfig = {
      percentage: {
        label: "Percentage",
      },
    };
    accumulatedStatusCounts
      .sort((a, b) => b.value - a.value)
      .forEach((error, index) => {
        config[error.name] = {
          label: error.name,
          color: `oklch(var(--chart-${(index % 10) + 1}))`,
        };
      });
    return config;
  }, [accumulatedStatusCounts]);

  const totalErrors = accumulatedStatusCounts.reduce(
    (sum, e) => sum + e.value,
    0
  );
  const errorPercentage = (totalErrors / (totalRequests ?? 1)) * 100 || 0;

  return (
    <Card className="h-full overflow-y-auto">
      <CardContent className="h-full pt-6">
        <div className="flex flex-col h-full">
          <h2 className="text-slate-500 text-sm mb-2">All Errors</h2>
          <div className="mb-2 text-sm">
            <span className="font-semibold">
              {formatLargeNumber(totalErrors)}
            </span>{" "}
            total errors (
            <span className="font-semibold">{errorPercentage.toFixed(2)}%</span>{" "}
            of all requests)
          </div>
          <div className="flex-grow flex flex-col">
            <div className="flex flex-row justify-between items-center pb-2">
              <p className="text-xs font-semibold text-slate-700">Error Type</p>
              <p className="text-xs font-semibold text-slate-700">Percentage</p>
            </div>
            <div>
              <ChartContainer
                config={errorChartConfig}
                className="w-full h-full relative"
                style={{
                  height: accumulatedStatusCounts.length * (35 + 5) + 10,
                }}
              >
                <BarChart
                  accessibilityLayer
                  data={accumulatedStatusCounts
                    .sort((a, b) => b.value - a.value)
                    .map((error) => ({
                      errorType: `${error.name} (${formatLargeNumber(
                        error.value
                      )})`,
                      percentage: (error.value / totalErrors) * 100,
                      fill: `var(--color-${error.name})`,
                    }))}
                  layout="vertical"
                  barCategoryGap={5}
                >
                  <YAxis
                    dataKey="errorType"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <XAxis dataKey="percentage" type="number" hide />
                  <Bar
                    dataKey="percentage"
                    layout="vertical"
                    radius={5}
                    maxBarSize={35}
                    opacity={0.6}
                  >
                    <LabelList
                      dataKey="errorType"
                      position="insideLeft"
                      className="fill-slate-700 dark:fill-slate-100 text-nowrap overflow-visible"
                      fontSize={14}
                      width={100}
                    />
                    <LabelList
                      dataKey="percentage"
                      position="right"
                      className="fill-slate-700 dark:fill-slate-100 text-nowrap overflow-visible"
                      fontSize={14}
                      width={100}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

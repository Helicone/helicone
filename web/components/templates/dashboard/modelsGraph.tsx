import { ModelMetric } from "@/lib/api/models/models";
import StyledAreaChart from "./styledAreaChart";
import { useMemo } from "react";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Bar, LabelList, XAxis, BarChart } from "recharts";
import { YAxis } from "recharts";

export const ModelsGraph = ({ modelData }: { modelData: ModelMetric[] }) => {
  const chartConfig = useMemo(() => {
    let config: ChartConfig = {
      percentage: {
        label: "Percentage",
      },
    };

    modelData.forEach((model, index) => {
      config[index] = {
        label: model.model || "n/a",
        color: `oklch(var(--chart-${(index % 10) + 1}))`,
      };
    });
    return config;
  }, [modelData]);

  const totalRequests = modelData.reduce(
    (sum, model) => sum + model.total_requests,
    0
  );

  return (
    <StyledAreaChart
      title={`Top Models`}
      value={undefined}
      isDataOverTimeLoading={false}
      withAnimation={true}
    >
      <div className="flex flex-row justify-between items-center pb-2">
        <p className="text-xs font-semibold text-slate-700">Name</p>
        <p className="text-xs font-semibold text-slate-700">Requests</p>
      </div>
      <div className="overflow-y-auto">
        <ChartContainer
          config={chartConfig}
          className="w-full h-full relative"
          style={{
            height: modelData.length * (35 + 5) + 10,
          }}
        >
          <BarChart
            accessibilityLayer
            data={modelData
              .map((model, index) => ({
                name: model.model || "n/a",
                percentage: (model.total_requests / totalRequests) * 100,
                value: model.total_requests,
                fill: `var(--color-${index})`,
              }))
              .sort((a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0))}
            layout="vertical"
            barCategoryGap={5}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
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
                dataKey="name"
                position="insideLeft"
                className="fill-slate-700 dark:fill-slate-100 text-nowrap overflow-visible"
                fontSize={14}
                width={100}
              />
              <LabelList
                dataKey="value"
                position="right"
                className="fill-slate-500 dark:fill-slate-100"
                fontSize={14}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </StyledAreaChart>
  );
};

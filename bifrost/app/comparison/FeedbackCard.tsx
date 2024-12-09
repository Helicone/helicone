import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Sector, ResponsiveContainer, Label } from "recharts";
import { Tooltip as ChartTooltip } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { components } from "@/lib/clients/jawnTypes/public";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeedbackCardProps {
  models: components["schemas"]["Model"][];
}

export default function FeedbackCard({ models }: FeedbackCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">User Feedback</h3>
            <p className="text-sm text-gray-500">Positive feedback rate</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model, index) => {
            const hasData =
              model.feedback?.positivePercentage != null &&
              model.feedback?.negativePercentage != null;

            const positivePercentage = hasData
              ? model.feedback.positivePercentage * 100
              : 0;
            const negativePercentage = hasData
              ? model.feedback.negativePercentage * 100
              : 0;
            const isWinner =
              hasData &&
              model.feedback.positivePercentage >
                (models[1 - index]?.feedback?.positivePercentage || 0);

            const chartData = hasData
              ? [
                  {
                    name: "Positive",
                    value: positivePercentage,
                    fill: index === 0 ? "#EF4444" : "#3B82F6",
                  },
                  {
                    name: "Negative",
                    value: negativePercentage,
                    fill: index === 0 ? "#FCA5A5" : "#93C5FD",
                  },
                ]
              : [];

            const chartConfig = {
              Positive: {
                label: "Positive",
                color: index === 0 ? "#EF4444" : "#3B82F6",
              },
              Negative: {
                label: "Negative",
                color: index === 0 ? "#FCA5A5" : "#93C5FD",
              },
            } satisfies ChartConfig;

            return (
              <div key={model.model} className="flex flex-col rounded-lg">
                <div className="max-w-[250px] mx-auto w-full">
                  <ChartContainer
                    config={chartConfig}
                    className="flex-1 pb-0 aspect-square"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      {hasData ? (
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          strokeWidth={5}
                          activeIndex={0}
                        >
                          <Label
                            content={({ viewBox }: any) => {
                              if (
                                viewBox &&
                                "cx" in viewBox &&
                                "cy" in viewBox
                              ) {
                                return (
                                  <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    <tspan
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      className="fill-foreground text-2xl font-bold"
                                    >
                                      {positivePercentage
                                        .toFixed(1)
                                        .toLocaleString()}
                                      %
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 24}
                                      className="fill-muted-foreground"
                                    >
                                      Positive
                                    </tspan>
                                  </text>
                                );
                              }
                            }}
                          />
                        </Pie>
                      ) : (
                        <Label
                          content={({ viewBox }: any) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="fill-slate-400 text-sm italic"
                                >
                                  No feedback data available
                                </text>
                              );
                            }
                          }}
                        />
                      )}
                    </PieChart>
                  </ChartContainer>
                </div>
                <div>
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      isWinner
                        ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-3 h-3 flex-shrink-0 rounded-sm ${
                        index === 0 ? "bg-red-500" : "bg-blue-500"
                      }`}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm ${
                                isWinner
                                  ? "font-bold text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              {model.model}
                              {isWinner && (
                                <span className="text-xs font-semibold text-purple-500 ml-1">
                                  WINNER
                                </span>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{model.model}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

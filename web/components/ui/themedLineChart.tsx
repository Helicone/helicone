import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartColor = "chart1" | "chart2" | "chart3" | "chart4" | "chart5";

interface ThemedLineChartProps<T> {
  /**
   * The data to be displayed in the chart
   */
  data: T[];
  /**
   * The key in the data object to be used as the x-axis value
   */
  index: keyof T;
  /**
   * The keys in the data object to be used as the y-axis values
   */
  categories: (keyof T)[];
  /**
   * The colors to be used for each category
   * Uses our design system chart colors (chart1-chart5)
   * @default ["chart1"]
   */
  colors?: ChartColor[];
  /**
   * Whether to show the y-axis
   * @default true
   */
  showYAxis?: boolean;
  /**
   * The type of curve to use
   * @default "monotone"
   */
  curveType?: "linear" | "monotone" | "step";
  /**
   * Whether to show animation
   * @default true
   */
  showAnimation?: boolean;
  /**
   * The duration of the animation in milliseconds
   * @default 1000
   */
  animationDuration?: number;
  /**
   * Optional formatter for the tooltip values
   */
  valueFormatter?: (value: number) => string;
  /**
   * Optional height for the chart
   * @default "14rem"
   */
  height?: string;
}

const colorMap: Record<ChartColor, string> = {
  chart1: "oklch(var(--chart-1))",
  chart2: "oklch(var(--chart-2))",
  chart3: "oklch(var(--chart-3))",
  chart4: "oklch(var(--chart-4))",
  chart5: "oklch(var(--chart-5))",
};

export function ThemedLineChart<T extends Record<string, any>>({
  data,
  index,
  categories,
  colors = ["chart1"],
  showYAxis = true,
  curveType = "monotone",
  showAnimation = true,
  animationDuration = 1000,
  valueFormatter,
  height = "14rem",
}: ThemedLineChartProps<T>) {
  return (
    <div style={{ width: "100%", height }} className="text-muted-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="text-border" />
          <XAxis
            dataKey={index as string}
            tick={{ fill: "currentColor" }}
            tickLine={{ stroke: "currentColor" }}
            axisLine={{ stroke: "currentColor" }}
          />
          {showYAxis && (
            <YAxis
              tick={{ fill: "currentColor" }}
              tickLine={{ stroke: "currentColor" }}
              axisLine={{ stroke: "currentColor" }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              color: "hsl(var(--foreground))",
            }}
            formatter={valueFormatter}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          {categories.map((category, i) => (
            <Area
              key={category as string}
              type={curveType}
              dataKey={category as string}
              stroke={colorMap[colors[i % colors.length]]}
              fill={colorMap[colors[i % colors.length]]}
              fillOpacity={0.3}
              isAnimationActive={showAnimation}
              animationDuration={animationDuration}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import React, { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { H3, P } from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { SubscriptionAnalytics } from "@/lib/SubscriptionAnalytics";
import { TrendingUp } from "lucide-react";

interface ProductRevenueTrendChartProps {
  productId: string;
  analytics: SubscriptionAnalytics;
}

const ProductRevenueTrendChart: React.FC<ProductRevenueTrendChartProps> = ({
  productId,
  analytics,
}) => {
  // Generate chart data from the subscription analytics
  const chartData = useMemo(() => {
    // Get the MRR data for this product over the last 6 months
    const mrrData = analytics.getMRRChartData({
      months: 6,
      productIds: [productId],
    });

    // Log raw data for debugging
    console.log("Raw MRR data from analytics:", mrrData);
    console.log("Looking for productId:", productId);

    // Log each month's data to see what's happening
    Object.entries(mrrData).forEach(([month, products]) => {
      console.log(`Month ${month}:`, products);
      if (products[productId]) {
        console.log(`  Product ${productId}:`, products[productId]);
      } else {
        console.log(`  Product ${productId} not found in this month's data`);
      }
    });

    // Transform the data into the format expected by the chart
    const monthData = Object.entries(mrrData)
      .map(([month, products]) => {
        const productData = products[productId] || { actual: 0, projected: 0 };

        // Convert from cents to dollars
        const actualRevenue = Math.round(productData.actual / 100);
        const projectedRevenue = Math.round(productData.projected / 100);

        console.log(
          `Month ${month}: actual=${actualRevenue}, projected=${projectedRevenue}, total=${
            actualRevenue + projectedRevenue
          }`
        );

        return {
          month: new Date(month).toLocaleString("default", { month: "short" }),
          actual: actualRevenue,
          projected: projectedRevenue,
          total: actualRevenue + projectedRevenue,
          date: new Date(month), // Keep date for sorting
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort chronologically
      .map(({ month, actual, projected, total }) => ({
        month,
        actual,
        projected,
        total,
      })); // Remove date after sorting but keep it clean

    console.log("Final processed chart data:", monthData);

    // If all data is zero, add some demo data
    const hasActualData = monthData.some(
      (item) => item.actual > 0 || item.projected > 0
    );
    if (!hasActualData) {
      console.log("No actual data found for this product, using demo data");
      //   return generateDemoData();
    }

    return monthData;
  }, [productId, analytics]);

  // Helper to generate demo data if no actual data exists
  const generateDemoData = () => {
    const now = new Date();
    const demoData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const actual = Math.floor(Math.random() * 5000) + 3000;
      const projected = i === 0 ? Math.floor(Math.random() * 2000) + 1000 : 0;
      demoData.push({
        month: date.toLocaleString("default", { month: "short" }),
        actual,
        projected,
        total: actual + projected,
      });
    }
    console.log("Generated demo data:", demoData);
    return demoData;
  };

  // Chart configuration
  const chartConfig = {
    actual: {
      label: "Billed Revenue",
      color: "hsl(var(--chart-1))",
    },
    projected: {
      label: "Projected Revenue",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Find the product name
  const productName = useMemo(() => {
    // We can't access the private subscriptions directly
    // Instead, we'll just use the product ID for now
    // A better approach would be to add a getProductName method to SubscriptionAnalytics
    return `Product ${productId.replace("prod_", "")}`;
  }, [productId]);

  // Calculate trending percentage
  const trendingPercentage = useMemo(() => {
    if (chartData.length < 2) return "0";

    const currentMonth = chartData[chartData.length - 1].total;
    const previousMonth = chartData[chartData.length - 2].total;

    if (previousMonth === 0) return "0";

    return (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1);
  }, [chartData]);

  const isTrendingUp = parseFloat(trendingPercentage) >= 0;

  return (
    <Card className="w-full">
      <style jsx>{`
        :global(:root) {
          --color-actual: hsl(var(--chart-1));
          --color-projected: hsl(var(--chart-2));
        }
      `}</style>
      <CardHeader className="pb-2">
        <H3>{productName} Revenue</H3>
        <P className="text-muted-foreground text-sm">
          Monthly revenue trend for the last 6 months
        </P>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="actual"
              stackId="a"
              fill="var(--color-actual)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="projected"
              stackId="a"
              fill="var(--color-projected)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {isTrendingUp ? "Trending up" : "Trending down"} by{" "}
          {Math.abs(parseFloat(trendingPercentage))}% this month
          {isTrendingUp ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingUp className="h-4 w-4 rotate-180" />
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing monthly revenue with projected values for current month
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductRevenueTrendChart;

import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TimeFilter } from "../../../services/lib/filters/filterDefs";
import { Col } from "../../layout/common/col";
import LoadingAnimation from "../../shared/loadingAnimation";
import RequestsPage from "../requests/RequestsPage";
import { useMemo } from "react";
import {
  getSmartTickFormatter,
  getTooltipTimeFormatter,
} from "./timeFormatters";

const chartConfig = {
  count: {
    label: "Rate Limit Count",
    color: "rgb(226, 54, 112)",
  },
  time: {
    label: "Time",
    color: "rgb(226, 54, 112)",
  },
} satisfies ChartConfig;

interface RateLimitRequestsViewProps {
  isLoading: boolean;
  chartData: Array<{ time: Date; count: number }>;
  timeFilter: TimeFilter;
}

const RateLimitRequestsView = ({
  isLoading,
  chartData,
  timeFilter,
}: RateLimitRequestsViewProps) => {
  // Create date references for formatting
  const start = useMemo(() => timeFilter.start || new Date(0), [timeFilter]);
  const end = useMemo(() => timeFilter.end || new Date(), [timeFilter]);

  // Format data for the chart
  const formattedChartData = useMemo(() => {
    return chartData.map((item) => ({
      time: new Date(item.time).getTime(),
      count: item.count,
      count_original: item.count,
    }));
  }, [chartData]);

  // Get smart formatters based on time range
  const tickFormatter = useMemo(
    () => getSmartTickFormatter(start, end),
    [start, end]
  );

  const tooltipFormatter = useMemo(
    () => getTooltipTimeFormatter(start, end),
    [start, end]
  );

  return (
    <Col>
      <div className="h-full w-full bg-card text-card-foreground rounded-md pt-6 pr-6 pl-6">
        {isLoading ? (
          <div className="h-[14rem] flex items-center justify-center">
            <LoadingAnimation height={100} width={100} />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[14rem] w-full">
            <BarChart
              accessibilityLayer
              data={formattedChartData}
              barSize={20}
              barGap={5}
              margin={{ left: 30, right: 30, top: 20, bottom: 20 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                scale="time"
                type="number"
                domain={["auto", "auto"]}
                tickFormatter={tickFormatter}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent labelFormatter={tooltipFormatter} />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
                name="count"
              />
            </BarChart>
          </ChartContainer>
        )}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 border-t">
        <RequestsPage
          currentPage={1}
          pageSize={25}
          sort={{ sortKey: null, sortDirection: null, isCustomProperty: false }}
          rateLimited={true}
          organizationLayoutAvailable={false}
        />
      </div>
    </Col>
  );
};

export default RateLimitRequestsView;

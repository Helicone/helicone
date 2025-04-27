import { BarChart, Bar, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { format } from "date-fns";
import { TimeFilter } from "../../../services/lib/filters/filterDefs";
import { Col } from "../../layout/common/col";
import LoadingAnimation from "../../shared/loadingAnimation";
import RequestsPage from "../requests/RequestsPage";

interface RateLimitRequestsViewProps {
  isLoading: boolean;
  // Ensure data type matches what's passed (using Date for time)
  chartData: Array<{ time: Date; count: number }>;
  chartConfig: ChartConfig;
  timeFilter: TimeFilter;
}

const RateLimitRequestsView = ({
  isLoading,
  chartData,
  chartConfig,
  timeFilter,
}: RateLimitRequestsViewProps) => {
  // Calculate duration for date formatting
  const durationMs = timeFilter.end.getTime() - timeFilter.start.getTime();
  const isMultiDay = durationMs >= 24 * 60 * 60 * 1000;

  return (
    <Col>
      <div className="h-full w-full bg-card text-card-foreground rounded-md pt-4">
        {isLoading ? (
          <div className="h-[14rem] flex items-center justify-center">
            <LoadingAnimation height={100} width={100} />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[14rem] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
            >
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => {
                  try {
                    const date =
                      value instanceof Date ? value : new Date(value);
                    return !isNaN(date.getTime())
                      ? format(date, isMultiDay ? "MMM d, HH:mm" : "HH:mm")
                      : "";
                  } catch (e) {
                    return "";
                  }
                }}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" hideLabel />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
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

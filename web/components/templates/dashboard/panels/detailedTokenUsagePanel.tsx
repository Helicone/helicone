import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CHART_COLORS } from "../../../../lib/chartColors";
import { formatLargeNumber } from "../../../shared/utils/numberFormat";
import LoadingAnimation from "../../../shared/loadingAnimation";
import StyledAreaChart from "../styledAreaChart";
import { getTimeMap } from "../../../../lib/timeCalculations/constants";
import { TimeIncrement } from "../../../../lib/timeCalculations/fetchTimeData";

interface DetailedTokenUsagePanelProps {
  data:
    | {
        data:
          | {
              prompt_tokens: number;
              completion_tokens: number;
              reasoning_tokens: number;
              prompt_cache_read_tokens: number;
              prompt_cache_write_tokens: number;
              time: Date;
            }[]
          | null;
        error: string | null;
      }
    | undefined;
  isLoading: boolean;
  timeIncrement: TimeIncrement;
}

const TOKEN_COLORS = {
  prompt: CHART_COLORS.blue,
  completion: CHART_COLORS.purple,
  reasoning: CHART_COLORS.orange,
  cacheRead: CHART_COLORS.cyan,
  cacheWrite: CHART_COLORS.teal,
};

const DetailedTokenUsagePanel = ({
  data,
  isLoading,
  timeIncrement,
}: DetailedTokenUsagePanelProps) => {
  const chartData =
    data?.data?.map((d) => ({
      date: getTimeMap(timeIncrement)(d.time),
      prompt: d.prompt_tokens,
      completion: d.completion_tokens,
      reasoning: d.reasoning_tokens,
      cacheRead: d.prompt_cache_read_tokens,
      cacheWrite: d.prompt_cache_write_tokens,
    })) ?? [];

  // Only show lines that have non-zero data
  const hasData = (key: string) =>
    chartData.some((d) => (d as any)[key] > 0);

  return (
    <StyledAreaChart
      title="Token Usage by Type"
      value={undefined}
      isDataOverTimeLoading={isLoading}
      withAnimation={true}
    >
      <div className="w-full pt-2">
        {isLoading ? (
          <div className="flex h-[180px] w-full items-center justify-center bg-muted">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : (
          <ChartContainer
            config={{
              prompt: {
                label: "Prompt",
                color: TOKEN_COLORS.prompt,
              },
              completion: {
                label: "Completion",
                color: TOKEN_COLORS.completion,
              },
              reasoning: {
                label: "Reasoning",
                color: TOKEN_COLORS.reasoning,
              },
              cacheRead: {
                label: "Cache Read",
                color: TOKEN_COLORS.cacheRead,
              },
              cacheWrite: {
                label: "Cache Write",
                color: TOKEN_COLORS.cacheWrite,
              },
            }}
            className="h-[180px] w-full"
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} tickLine={false} />
              <YAxis
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => formatLargeNumber(v)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      `${new Intl.NumberFormat("us").format(Number(value))} tokens`
                    }
                  />
                }
              />
              {hasData("prompt") && (
                <Line
                  type="monotone"
                  dataKey="prompt"
                  stroke="var(--color-prompt)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {hasData("completion") && (
                <Line
                  type="monotone"
                  dataKey="completion"
                  stroke="var(--color-completion)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {hasData("reasoning") && (
                <Line
                  type="monotone"
                  dataKey="reasoning"
                  stroke="var(--color-reasoning)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {hasData("cacheRead") && (
                <Line
                  type="monotone"
                  dataKey="cacheRead"
                  stroke="var(--color-cacheRead)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {hasData("cacheWrite") && (
                <Line
                  type="monotone"
                  dataKey="cacheWrite"
                  stroke="var(--color-cacheWrite)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </StyledAreaChart>
  );
};

export default DetailedTokenUsagePanel;

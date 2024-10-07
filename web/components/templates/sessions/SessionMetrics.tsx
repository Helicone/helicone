import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSeconds } from "@/lib/sql/timeHelpers";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { BarChart, Card, Title } from "@tremor/react";
import { useState } from "react";
import { useSessionMetrics } from "../../../services/hooks/sessions";
import { Row } from "../../layout/common";
import { Col } from "../../layout/common/col";
import LoadingAnimation from "../../shared/loadingAnimation";
import { formatLargeNumber } from "../../shared/utils/numberFormat";
import { SessionResult } from "./sessionDetails";

interface SessionMetricsProps {
  selectedSession: SessionResult | null;
}

interface ChartProps {
  title: string;
  data: any[];
  category: string;
  color: string;
  valueFormatter: (value: number) => string;
  isLoading: boolean;
  xAxisLabel: string;
}

const Chart: React.FC<ChartProps> = ({
  title,
  data,
  category,
  color,
  valueFormatter,
  isLoading,
  xAxisLabel,
}) => (
  <Card>
    <Title>{title}</Title>
    {isLoading ? (
      <div className="h-64">
        <LoadingAnimation height={200} width={200} />
      </div>
    ) : (
      <BarChart
        data={data}
        index="range"
        categories={[category]}
        colors={[color]}
        valueFormatter={valueFormatter}
        yAxisWidth={100}
        showLegend={false}
        showXAxis={true}
        xAxisLabel={xAxisLabel}
        className="p-5 h-80"
      />
    )}
  </Card>
);

const SessionMetrics = ({ selectedSession }: SessionMetricsProps) => {
  const [pSize, setPSize] = useLocalStorage<
    "p50" | "p75" | "p95" | "p99" | "p99.9"
  >("session-details-pSize", "p75");
  const [useInterquartile, setUseInterquartile] = useState(false);

  const { metrics, isLoading } = useSessionMetrics(
    selectedSession?.name ?? "",
    pSize,
    useInterquartile
  );

  return (
    <Col className="space-y-4">
      <div className="space-y-2 px-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Label
          htmlFor="percentile-select"
          className="text-slate-500 dark:text-slate-500"
        >
          Select Percentile
        </Label>
        <Row className="items-center gap-2">
          <Select
            onValueChange={(value) =>
              setPSize(value as "p50" | "p75" | "p95" | "p99" | "p99.9")
            }
            value={pSize}
          >
            <SelectTrigger id="percentile-select" className="w-full">
              <SelectValue placeholder="Percentile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p50">p50</SelectItem>
              <SelectItem value="p75">p75</SelectItem>
              <SelectItem value="p95">p95</SelectItem>
              <SelectItem value="p99">p99</SelectItem>
              <SelectItem value="p99.9">p99.9</SelectItem>
            </SelectContent>
          </Select>
          <Row className="items-center gap-2">
            <Checkbox
              checked={useInterquartile}
              onCheckedChange={(checked) =>
                setUseInterquartile(checked as boolean)
              }
              className="w-3 h-3 text-slate-500 dark:text-slate-500 border-slate-500 dark:border-slate-500"
            />
            <Label className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Interquartile
            </Label>
          </Row>
        </Row>
      </div>

      <Chart
        title="Requests count distribution"
        data={metrics.session_count.map((sessionCount) => {
          const start = Math.ceil(Number(sessionCount.range_start ?? 0));
          const end = Math.floor(Number(sessionCount.range_end ?? 0));
          return {
            range: start === end ? `${start}` : `${start}-${end}`,
            count: Math.round(sessionCount.value),
          };
        })}
        category="count"
        color="blue"
        valueFormatter={(value) => `${formatLargeNumber(value, true)} sessions`}
        isLoading={isLoading}
        xAxisLabel="Requests per session"
      />

      <Chart
        title="Cost distribution"
        data={metrics.session_cost.map((sessionCost) => {
          const start = Math.round(Number(sessionCost.range_start ?? 0));
          const end = Math.round(Number(sessionCost.range_end ?? 0));
          return {
            range:
              start === end
                ? `$${formatLargeNumber(start)}`
                : `$${formatLargeNumber(start)}-$${formatLargeNumber(end)}`,
            cost: Math.round(sessionCost.value),
          };
        })}
        category="cost"
        color="green"
        valueFormatter={(value) => `${formatLargeNumber(value, true)} sessions`}
        isLoading={isLoading}
        xAxisLabel="Cost per session"
      />

      <Chart
        title="Duration distribution"
        data={metrics.session_duration.map((sessionDuration) => {
          const start = Math.round(Number(sessionDuration.range_start ?? 0));
          const end = Math.round(Number(sessionDuration.range_end ?? 0));
          return {
            range:
              start === end
                ? formatSeconds(start)
                : `${formatSeconds(start)}-${formatSeconds(end)}`,
            duration: Math.round(sessionDuration.value),
          };
        })}
        category="duration"
        color="purple"
        valueFormatter={(value) => `${formatLargeNumber(value, true)} sessions`}
        isLoading={isLoading}
        xAxisLabel="Duration per session"
      />
    </Col>
  );
};

export default SessionMetrics;

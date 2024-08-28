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
}

const Chart: React.FC<ChartProps> = ({
  title,
  data,
  category,
  color,
  valueFormatter,
  isLoading,
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
      <div className="space-y-2">
        <Label htmlFor="percentile-select">Select Percentile</Label>
        <Row className="items-center gap-2">
          <Col>
            <Select
              onValueChange={(value) =>
                setPSize(value as "p50" | "p75" | "p95" | "p99" | "p99.9")
              }
              value={pSize}
            >
              <SelectTrigger id="percentile-select" className="w-[100px]">
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
          </Col>
          <Row className="items-center gap-2">
            <Checkbox
              checked={useInterquartile}
              onCheckedChange={(checked) =>
                setUseInterquartile(checked as boolean)
              }
            />
            <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Interquartile
            </Label>
          </Row>
        </Row>
      </div>

      <Chart
        title="Session Count"
        data={metrics.session_count.map((sessionCount) => ({
          range: `${Math.round(
            Number(sessionCount.range_start ?? 0)
          )}-${Math.round(Number(sessionCount.range_end ?? 0))}`,
          count: Math.round(sessionCount.value),
        }))}
        category="count"
        color="blue"
        valueFormatter={(value) => `${Math.round(value)} sessions`}
        isLoading={isLoading}
      />

      <Chart
        title="Session Cost"
        data={metrics.session_cost.map((sessionCost) => ({
          range: `$${formatLargeNumber(
            Math.round(Number(sessionCost.range_start ?? 0))
          )}-$${formatLargeNumber(
            Math.round(Number(sessionCost.range_end ?? 0))
          )}`,
          cost: Math.round(sessionCost.value),
        }))}
        category="cost"
        color="green"
        valueFormatter={(value) => `${formatLargeNumber(value)} sessions`}
        isLoading={isLoading}
      />

      <Chart
        title="Session Duration"
        data={metrics.session_duration.map((sessionDuration) => ({
          range: `${formatSeconds(
            Math.round(Number(sessionDuration.range_start ?? 0))
          )}-${formatSeconds(
            Math.round(Number(sessionDuration.range_end ?? 0))
          )}`,
          duration: Math.round(sessionDuration.value),
        }))}
        category="duration"
        color="purple"
        valueFormatter={(value) => `${formatLargeNumber(value)} sessions`}
        isLoading={isLoading}
      />
    </Col>
  );
};

export default SessionMetrics;

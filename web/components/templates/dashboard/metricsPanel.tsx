import {
  AdjustmentsVerticalIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  CurrencyDollarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";
import { DashboardMode, Loading } from "./dashboardPage";

interface MetricsPanelProps {
  metrics: Loading<Result<Metrics, string>>;
  mode: DashboardMode;
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { metrics: metricsData, mode } = props;

  const isLoading = metricsData === "loading";

  const data =
    metricsData === "loading" || metricsData.error !== null
      ? null
      : metricsData.data;

  const metrics = [
    {
      value: data?.total_cost ? `$${data?.total_cost?.toFixed(2)}` : "$0.00",
      label: "Total Cost",
      icon: CurrencyDollarIcon,
    },
    {
      value: +(data?.total_requests ?? 0),

      label: "Total Requests",
      icon: TableCellsIcon,
    },
    {
      value: +(data?.total_tokens ?? 0),
      label: "Total Tokens",
      icon: ChartBarIcon,
    },
    {
      value: data?.average_response_time?.toFixed(2) ?? "n/a",
      label: "Avg Latency",
      icon: CloudArrowDownIcon,
    },
  ];

  return (
    <div>
      <dl className="mx-auto w-full grid grid-cols-1 sm:grid-cols-4 text-gray-900 gap-4">
        {metrics.map((row) => (
          <div
            className="p-6 bg-white border border-gray-300 rounded-lg space-y-2"
            key={row.label}
          >
            <div className="w-full flex flex-row items-center justify-between">
              <dd className="text-sm  text-gray-700">{row.label}</dd>
              {<row.icon className="h-5 w-5" aria-hidden="true" />}
            </div>

            <dt className="text-2xl font-semibold">
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-300 rounded-lg animate-pulse" />
              ) : (
                row.value
              )}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

import {
  AdjustmentsVerticalIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";
import { Loading } from "./dashboardPage";

interface MetricsPanelProps {
  metrics: Loading<Result<Metrics, string>>;
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { metrics: metricsData } = props;

  const loading = metricsData === "loading";
  const data =
    metricsData === "loading" || metricsData.error !== null
      ? null
      : metricsData.data;

  const numberOfDaysActive = !data?.first_request
    ? null
    : Math.floor(
        (new Date().getTime() - (data.first_request!.getTime() ?? 0)) /
          (86400 * 1000) +
          1
      );

  const metrics = [
    {
      value: `$${data?.total_cost?.toFixed(2)}` ?? "n/a",
      label: "Total Cost",
      icon: CurrencyDollarIcon,
    },
    {
      value: +(data?.total_requests ?? 0) + +(data?.total_cached_requests ?? 0),
      label: "Total requests",
      icon: TableCellsIcon,
    },
    {
      value:
        numberOfDaysActive && data?.total_requests
          ? (data?.total_requests / numberOfDaysActive).toFixed(2)
          : "n/a",
      label: "Avg Requests / day",
      icon: ChartBarIcon,
    },
    // {
    //   value: data?.average_response_time?.toFixed(2) ?? "n/a",
    //   label: "Avg Response Time (s)",
    // },
    {
      value: data?.average_tokens_per_response?.toFixed(2) ?? "n/a",
      label: "Avg Token / Response",
      icon: AdjustmentsVerticalIcon,
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

            <dt className="text-2xl font-semibold">{row.value}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

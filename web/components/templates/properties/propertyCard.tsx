import {
  CloudArrowDownIcon,
  CurrencyDollarIcon,
  TableCellsIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  MetricsPanel,
  MetricsPanelProps,
} from "../../shared/metrics/metricsPanel";
import { usePropertyCard } from "./useProperty";
import { MdLaunch } from "react-icons/md";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { INITIAL_COLUMNS } from "./initialColumns";

interface PropertyCardPageProps {
  property: string;
  timeFilter: {
    start: Date;
    end: Date;
  };
  onDelete: () => void;
}

const PropertyCard = (props: PropertyCardPageProps) => {
  const { property, timeFilter, onDelete } = props;

  const { keyMetrics, valueMetrics } = usePropertyCard({
    timeFilter,
    property,
  });

  const metricsData: MetricsPanelProps["metric"][] = [
    {
      id: "totalCost",
      value: keyMetrics.totalCost.data?.data
        ? `$${keyMetrics.totalCost.data?.data.toFixed(5)}`
        : "$0.00",
      label: "Total Cost",
      labelUnits: "(est.)",
      icon: CurrencyDollarIcon,
      isLoading: keyMetrics.totalCost.isLoading,
      onInformationHref: "https://docs.helicone.ai/faq/how-we-calculate-cost",
    },
    {
      id: "totalRequests",
      value: +(keyMetrics.totalRequests?.data?.data?.toFixed(2) ?? 0),
      label: "Total Requests",
      icon: TableCellsIcon,
      isLoading: keyMetrics.totalRequests.isLoading,
    },
    {
      id: "averageLatency",
      value: keyMetrics.averageLatency.data?.data
        ? (keyMetrics.averageLatency.data.data / 1000).toFixed(2)
        : "n/a",
      label: "Avg Latency/Req",
      labelUnits: "s",
      icon: CloudArrowDownIcon,
      isLoading: keyMetrics.averageLatency.isLoading,
    },
  ];

  return (
    <>
      <div className="bg-white dark:bg-black p-8 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm flex flex-col space-y-4">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {property}
          </h1>
          <button
            onClick={onDelete}
            className="p-1 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          </button>
        </div>
        <div className="mx-auto w-full grid grid-cols-1 sm:grid-cols-3 text-gray-900 dark:text-gray-100 gap-4">
          {metricsData.map((m, i) => (
            <MetricsPanel metric={m} key={i} />
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-4">
          <div className="text-gray-500 italic text-sm">
            Showing top 10 results
          </div>
          <ThemedTableV5
            dataLoading={false}
            defaultData={
              valueMetrics.aggregatedKeyMetrics?.data?.data?.map((d) => ({
                ...d,
                average_cost_per_request: d.total_cost / d.total_requests,
                avg_latency_per_request: d.avg_latency_per_request / 1000,
              })) ?? []
            }
            defaultColumns={INITIAL_COLUMNS}
            tableKey="propertyCardColumnVisibility"
          />
        </div>
      </div>
    </>
  );
};

export default PropertyCard;

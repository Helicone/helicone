import {
  CloudArrowDownIcon,
  CurrencyDollarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  MetricsPanel,
  MetricsPanelProps,
} from "../../shared/metrics/metricsPanel";
import { usePropertyCard } from "./useProperty";

interface PropertyCardPageProps {
  property: string;
  timeFilter: {
    start: Date;
    end: Date;
  };
}

const PropertyCard = (props: PropertyCardPageProps) => {
  const { property, timeFilter } = props;
  const { keyMetrics } = usePropertyCard({
    timeFilter,
    property,
  });
  const metricsData: MetricsPanelProps["metric"][] = [
    {
      value: keyMetrics.totalCost.data?.data
        ? `$${keyMetrics.totalCost.data?.data.toFixed(2)}`
        : "$0.00",
      label: "Total Cost",
      labelUnits: "(est.)",
      icon: CurrencyDollarIcon,
      isLoading: keyMetrics.totalCost.isLoading,
      onInformationHref:
        "https://docs.helicone.ai/how-it-works/how-we-calculate-costs",
    },
    {
      value: +(keyMetrics.totalRequests?.data?.data?.toFixed(2) ?? 0),
      label: "Total Requests",
      icon: TableCellsIcon,
      isLoading: keyMetrics.totalRequests.isLoading,
    },
    {
      value: keyMetrics.averageLatency.data?.data?.toFixed(2) ?? "n/a",
      label: "Avg Latency/Req",
      labelUnits: "ms",
      icon: CloudArrowDownIcon,
      isLoading: keyMetrics.averageLatency.isLoading,
    },
  ];

  return (
    <>
      <div className="bg-white p-5 rounded-md">
        <h1 className="text-2xl font-semibold mb-5">{property}</h1>
        <div className="mx-auto w-full grid grid-cols-1 sm:grid-cols-3 text-gray-900 gap-4">
          {metricsData.map((m, i) => (
            <MetricsPanel metric={m} key={i} />
          ))}
        </div>
      </div>
    </>
  );
};

export default PropertyCard;

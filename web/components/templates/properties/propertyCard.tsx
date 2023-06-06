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
import { MdLaunch } from "react-icons/md";
import ThemedTable from "../../shared/themed/themedTable";

interface PropertyCardPageProps {
  property: string;
  timeFilter: {
    start: Date;
    end: Date;
  };
}

const PropertyCard = (props: PropertyCardPageProps) => {
  const { property, timeFilter } = props;
  const { keyMetrics, valueMetrics } = usePropertyCard({
    timeFilter,
    property,
  });
  const metricsData: MetricsPanelProps["metric"][] = [
    {
      value: keyMetrics.totalCost.data?.data
        ? `$${keyMetrics.totalCost.data?.data.toFixed(5)}`
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
        <div className="flex flex-row justify-between items-center py-3">
          <h1 className="text-2xl font-semibold">{property}</h1>
          {/* 
          <button className="border p-2 my-2 shadow-sm hover:shadow-md rounded-md flex flex-row items-center gap-2">
            Open request page
            <MdLaunch className="inline-block ml-2" />
          </button> */}
        </div>
        <div className="mx-auto w-full grid grid-cols-1 sm:grid-cols-3 text-gray-900 gap-4">
          {metricsData.map((m, i) => (
            <MetricsPanel metric={m} key={i} />
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-6">
          <div>Showing top 10 results</div>

          <ThemedTable
            columns={[
              { name: "Value", key: "property_value", hidden: false },
              { name: "First see", key: "active_since", hidden: false },
              { name: "Requests", key: "total_requests", hidden: false },
              {
                name: "Avg Completion Tokens/Req",
                key: "avg_completion_tokens_per_request",
                hidden: true,
              },
              {
                name: "Avg Latency/Req",
                key: "avg_latency_per_request",
                subName: "s",
                hidden: true,
              },
              {
                name: "Avg Cost/Req",
                key: "average_cost_per_request",
                hidden: true,
                subName: "USD",
              },
              {
                name: "Total Cost",
                key: "total_cost",
                hidden: true,
                subName: "USD",
              },
            ]}
            rows={
              valueMetrics.aggregatedKeyMetrics?.data?.data?.map((d) => ({
                ...d,
                average_cost_per_request: d.total_cost / d.total_requests,
                avg_latency_per_request: d.avg_latency_per_request / 1000,
              })) ?? []
            }
          />
        </div>
      </div>
    </>
  );
};

export default PropertyCard;

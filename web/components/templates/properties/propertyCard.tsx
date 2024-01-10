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
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { INITIAL_COLUMNS } from "./initialColumns";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import { useGetProperties } from "../../../services/hooks/properties";
import {
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { encodeFilter } from "../requestsV2/requestsPageV2";

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

  const router = useRouter();

  const { keyMetrics, valueMetrics } = usePropertyCard({
    timeFilter,
    property,
  });

  const {
    properties,
    isLoading: isPropertiesLoading,
    propertyFilters,
    searchPropertyFilters,
  } = useGetProperties();

  const filterMap = (REQUEST_TABLE_FILTERS as SingleFilterDef<any>[]).concat(
    propertyFilters
  );

  console.log(filterMap);

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
      <div className="bg-white dark:bg-black p-8 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm flex flex-col space-y-8">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {property}
          </h1>
          <div className="flex flex-row items-center gap-2">
            <Tooltip title="Close">
              <button
                onClick={onDelete}
                className="p-1 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="mx-auto w-full flex flex-wrap text-gray-900 dark:text-gray-100 gap-4">
          {metricsData.map((m, i) => (
            <MetricsPanel metric={m} key={i} wFull={false} />
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-4">
          <div className="text-gray-500 italic text-sm -mb-10">
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
            onRowSelect={(row) => {
              const value = row.property_value;

              const filterMapIndex = filterMap.findIndex(
                (f) => f.label === property
              );

              const currentAdvancedFilters = encodeURIComponent(
                JSON.stringify(
                  [
                    {
                      filterMapIdx: filterMapIndex,
                      operatorIdx: 0,
                      value,
                    },
                  ]
                    .map(encodeFilter)
                    .join("|")
                )
              );

              router.push({
                pathname: "/requests",
                query: {
                  t: "3m",
                  filters: JSON.stringify(currentAdvancedFilters),
                },
              });
            }}
          />
        </div>
      </div>
    </>
  );
};

export default PropertyCard;

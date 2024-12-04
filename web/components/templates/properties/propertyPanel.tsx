import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsPointingOutIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TableCellsIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { usePropertyCard } from "./useProperty";

import { useState } from "react";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import {
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
  getPropertyFiltersV2,
} from "../../../services/lib/filters/frontendFilterDefs";
import LoadingAnimation from "../../shared/loadingAnimation";
import ExportButton from "../../shared/themed/table/exportButton";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedTableHeader from "../../shared/themed/themedHeader";
import useSearchParams from "../../shared/utils/useSearchParams";
import { formatNumber } from "../users/initialColumns";
import { SimpleTable } from "../../shared/table/simpleTable";

interface PropertyPanelProps {
  property: string;
}

const PropertyPanel = (props: PropertyPanelProps) => {
  const { property } = props;
  const searchParams = useSearchParams();

  const [showMore, setShowMore] = useState(false);
  const router = useRouter();

  const getInterval = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval
  );
  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo("1m"),
    end: new Date(),
  });

  const { keyMetrics, valueMetrics, refetch, isRefetching, isAnyLoading } =
    usePropertyCard({
      timeFilter,
      property,
      limit: showMore ? 100 : 11,
    });

  const {
    properties,
    isLoading: isPropertiesLoading,
    propertyFilters,
    searchPropertyFilters,
  } = useGetPropertiesV2(getPropertyFiltersV2);

  const filterMap = (REQUEST_TABLE_FILTERS as SingleFilterDef<any>[]).concat(
    propertyFilters
  );

  function encodeFilter(filter: UIFilterRow): string {
    return `${filterMap[filter.filterMapIdx].label}:${
      filterMap[filter.filterMapIdx].operators[filter.operatorIdx].label
    }:${filter.value}`;
  }

  const propertyValueData =
    valueMetrics.aggregatedKeyMetrics?.data?.data?.map((d) => ({
      ...d,
      average_cost_per_request: d.total_cost / d.total_requests,
      avg_latency_per_request: d.avg_latency_per_request / 1000,
    })) ?? [];

  const getPropertyValueData = () => {
    if (showMore) {
      return propertyValueData;
    } else {
      return propertyValueData?.slice(0, 10);
    }
  };

  const cleanedValueData = getPropertyValueData();

  return (
    <div className="flex flex-col space-y-4 mt-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <ThemedTableHeader
          isFetching={false}
          timeFilter={{
            currentTimeFilter: timeFilter,
            customTimeFilter: true,
            timeFilterOptions: [],
            defaultTimeFilter: interval,
            onTimeSelectHandler: (key: TimeInterval, value: string) => {
              if ((key as string) === "custom") {
                value = value.replace("custom:", "");
                const start = new Date(value.split("_")[0]);
                const end = new Date(value.split("_")[1]);
                setInterval(key);
                setTimeFilter({
                  start,
                  end,
                });
              } else {
                setInterval(key);
                setTimeFilter({
                  start: getTimeIntervalAgo(key),
                  end: new Date(),
                });
              }
            },
          }}
        />
        <ExportButton
          rows={cleanedValueData.map((propertyValue) => ({
            Value: propertyValue.property_value,
            Requests: propertyValue.total_requests,
            Cost: propertyValue.total_cost,
            "Avg Comp Tokens": propertyValue.avg_completion_tokens_per_request,
            "Avg Latency": propertyValue.avg_latency_per_request,
            "Avg Cost": propertyValue.average_cost_per_request,
          }))}
        />
      </div>
      {property === "" ? (
        <div className="flex flex-col w-full h-96 justify-center items-center">
          <div className="flex flex-col w-2/5">
            <TagIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
            <p className="text-xl text-black dark:text-white font-semibold mt-8">
              No Property Selected
            </p>
            <p className="text-sm text-gray-500 max-w-sm mt-2">
              Please select a property to view its metrics
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <ul className="flex flex-col md:flex-row items-center gap-4">
            <li className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-4 flex flex-row rounded-lg items-center gap-4">
              <CurrencyDollarIcon className="h-6 w-6 text-sky-500" />
              <div className="flex flex-col">
                <dt className="text-gray-500 text-sm">Cost</dt>
                {isAnyLoading ? (
                  <div className="animate-pulse h-7 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                ) : (
                  <dd className="text-gray-900 dark:text-gray-100 text-xl font-semibold">
                    {keyMetrics.totalCost.data?.data
                      ? `$${keyMetrics.totalCost.data?.data.toFixed(5)}`
                      : "$0.00"}
                  </dd>
                )}
              </div>
            </li>
            <li className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-4 flex flex-row rounded-lg items-center gap-4">
              <TableCellsIcon className="h-6 w-6 text-pink-500" />
              <div className="flex flex-col">
                <dt className="text-gray-500 text-sm">Requests</dt>
                {isAnyLoading ? (
                  <div className="animate-pulse h-7 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                ) : (
                  <dd className="text-gray-900 dark:text-gray-100 text-xl font-semibold">
                    {+(keyMetrics.totalRequests?.data?.data?.toFixed(2) ?? 0)}
                  </dd>
                )}
              </div>
            </li>{" "}
            <li className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-4 flex flex-row rounded-lg items-center gap-4">
              <ClockIcon className="h-6 w-6 text-violet-500" />
              <div className="flex flex-col">
                <dt className="text-gray-500 text-sm">Average Latency / Req</dt>
                {isAnyLoading ? (
                  <div className="animate-pulse h-7 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                ) : (
                  <dd className="text-gray-900 dark:text-gray-100 text-xl font-semibold">
                    {keyMetrics.averageLatency.data?.data
                      ? (keyMetrics.averageLatency.data.data / 1000).toFixed(2)
                      : "n/a"}
                  </dd>
                )}
              </div>
            </li>
          </ul>

          {isAnyLoading ? (
            <div className="py-8">
              <LoadingAnimation title="Loading Data..." />
            </div>
          ) : (
            <SimpleTable
              className="w-full border rounded"
              data={cleanedValueData}
              columns={[
                {
                  key: "property_value" as keyof (typeof cleanedValueData)[0],
                  header: "Value",
                  render: (propertyValue) => (
                    <div
                      className="flex flex-row items-start font-semibold max-w-[200px] 2xl:max-w-[400px] truncate underline hover:cursor-pointer"
                      onClick={() => {
                        const value = propertyValue.property_value;
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
                            filters: currentAdvancedFilters,
                          },
                        });
                      }}
                    >
                      {propertyValue.property_value}
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 inline ml-1 text-gray-700 dark:text-gray-300" />
                    </div>
                  ),
                },
                {
                  key: "total_requests" as keyof (typeof cleanedValueData)[0],
                  header: "Requests",
                  render: (propertyValue) => propertyValue.total_requests,
                },
                {
                  key: "total_cost" as keyof (typeof cleanedValueData)[0],
                  header: "Cost",
                  render: (propertyValue) =>
                    `$${formatNumber(propertyValue.total_cost, 6)}`,
                },
                {
                  key: "avg_completion_tokens_per_request" as keyof (typeof cleanedValueData)[0],
                  header: "Avg Comp Tokens",
                  render: (propertyValue) =>
                    formatNumber(
                      propertyValue.avg_completion_tokens_per_request,
                      6
                    ),
                },
                {
                  key: "avg_latency_per_request" as keyof (typeof cleanedValueData)[0],
                  header: "Avg Latency",
                  render: (propertyValue) =>
                    formatNumber(propertyValue.avg_latency_per_request, 6),
                },
                {
                  key: "average_cost_per_request" as keyof (typeof cleanedValueData)[0],
                  header: "Avg Cost",
                  render: (propertyValue) =>
                    `$${formatNumber(
                      propertyValue.average_cost_per_request,
                      6
                    )}`,
                },
              ]}
              emptyMessage="No property data available"
            />
          )}

          {!showMore && propertyValueData.length > 10 && (
            <div className="w-full items-center flex justify-center p-2">
              <button
                onClick={() => {
                  setShowMore(true);
                  refetch();
                }}
                className="text-black dark:text-white border p-2 border-gray-300 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:hover:bg-gray-900 rounded-lg font-semibold flex flex-row gap-2 items-center text-sm"
              >
                {isRefetching ? (
                  <div className="animate-spin h-4 w-4">
                    <ArrowPathIcon />
                  </div>
                ) : (
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                )}
                Show More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyPanel;

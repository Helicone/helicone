import { BookOpenIcon, CircleStackIcon } from "@heroicons/react/24/outline";
import { AreaChart } from "@tremor/react";
import Link from "next/link";
import { useState } from "react";
import { TimeFilter } from "../../../lib/api/handlerWrappers";
import { Result, resultMap } from "../../../lib/result";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useBackendMetricCall } from "../../../services/hooks/useBackendFunction";
import { Col } from "../../layout/common/col";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import useSearchParams from "../../shared/utils/useSearchParams";
import RequestsPageV2 from "../requestsV2/requestsPageV2";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { getPropertyFiltersV2 } from "../../../services/lib/filters/frontendFilterDefs";

const RateLimitPage = (props: {}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    start: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
    end: new Date(),
  });
  const searchParams = useSearchParams();
  const getDefaultValue = () => {
    const currentTimeFilter = searchParams.get("t");

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };
  const { properties } = useGetPropertiesV2(getPropertyFiltersV2);

  const rateLimitOverTime = useBackendMetricCall<
    Result<RequestsOverTime[], string>
  >({
    params: {
      timeFilter: timeFilter,
      userFilters: [
        {
          request_response_versioned: {
            properties: {
              "Helicone-Rate-Limit-Status": {
                equals: "rate_limited",
              },
            },
          },
        },
      ],
      timeZoneDifference: 0,
    },
    endpoint: "/api/metrics/requestOverTime",
    key: "requestOverTime",
    postProcess: (data) => {
      return resultMap(data, (d) =>
        d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
      );
    },
  });

  const onTimeSelectHandler = (key: string, value: string) => {
    if (key === "custom") {
      const [start, end] = value.split("_");
      setTimeFilter({
        start: new Date(start),
        end: new Date(end),
      });
      return;
    }
    setTimeFilter({
      start: getTimeIntervalAgo(key as TimeInterval),
      end: new Date(),
    });
  };

  return (
    <>
      <AuthHeader
        title={"Rate limits"}
        actions={
          <Link
            href="https://docs.helicone.ai/features/advanced-usage/custom-rate-limits"
            target="_blank"
            rel="noreferrer noopener"
            className="w-fit flex items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <BookOpenIcon className="h-4 w-4" />
          </Link>
        }
      />
      {!properties.find((x) => x === "Helicone-Rate-Limit-Status") ? (
        <>
          <div className="flex flex-col w-full h-96 justify-center items-center">
            <div className="flex flex-col w-2/5">
              <CircleStackIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
              <p className="text-xl text-black dark:text-white font-semibold mt-8">
                No Rate Limit data available
              </p>
              <p className="text-sm text-gray-500 max-w-sm mt-2">
                Please view our documentation to learn how to enable rate limits
                for your requests.
              </p>
              <div className="mt-4">
                <Link
                  href="https://docs.helicone.ai/features/advanced-usage/custom-rate-limits"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  View Docs
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Col className="gap-8">
          <ThemedTimeFilter
            currentTimeFilter={timeFilter}
            timeFilterOptions={[
              { key: "24h", value: "24H" },
              { key: "7d", value: "7D" },
              { key: "1m", value: "1M" },
              { key: "3m", value: "3M" },
            ]}
            onSelect={onTimeSelectHandler}
            isFetching={false}
            defaultValue={getDefaultValue()}
            custom={true}
          />
          <div className="h-full w-full bg-white dark:bg-gray-800 rounded-md pt-4">
            {rateLimitOverTime.isLoading ? (
              <LoadingAnimation height={175} width={175} />
            ) : (
              <AreaChart
                className="h-[14rem]"
                data={
                  rateLimitOverTime.data?.data?.map((d) => ({
                    time: d.time.toISOString(),
                    count: d.count,
                  })) ?? []
                }
                index="time"
                categories={["count"]}
                colors={["red"]}
                showYAxis={false}
                curveType="monotone"
              />
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <RequestsPageV2
              currentPage={1}
              pageSize={25}
              sort={{
                sortKey: null,
                sortDirection: null,
                isCustomProperty: false,
              }}
              rateLimited={true}
              currentFilter={null}
              organizationLayout={null}
              organizationLayoutAvailable={false}
            />
          </div>
        </Col>
      )}
    </>
  );
};

export default RateLimitPage;

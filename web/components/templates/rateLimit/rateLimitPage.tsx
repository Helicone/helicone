import { BookOpenIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { AreaChart, Badge, Divider } from "@tremor/react";
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
import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";
import { DiffHighlight } from "../welcome/diffHighlight";

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

  const org = useOrg();
  const isPro =
    org?.currentOrg?.tier === "pro-20240913" ||
    org?.currentOrg?.tier === "growth";

  const rateLimitFilterLeaf = {
    request_response_rmt: {
      properties: {
        "Helicone-Rate-Limit-Status": {
          equals: "rate_limited",
        },
      },
    },
  };

  const rateLimitOverTime = useBackendMetricCall<
    Result<RequestsOverTime[], string>
  >({
    params: {
      timeFilter: timeFilter,
      userFilters: {
        left: rateLimitFilterLeaf,
        operator: "and",
        right: "all",
      },
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
        title={
          <div className="flex items-center gap-2">
            Rate limits <Badge size="sm">Beta</Badge>
          </div>
        }
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
      {!isPro || !properties.find((x) => x === "Helicone-Rate-Limit-Status") ? (
        <div className="flex flex-col w-full mt-16 justify-center items-center">
          <div className="flex flex-col">
            <div className="w-fit pt-2 pl-0.5 bg-white border border-gray-300 rounded-md">
              <ShieldCheckIcon className="h-10 w-10 flex items-center justify-center ml-2 text-gray-500" />
            </div>

            <p className="text-xl text-black dark:text-white font-semibold mt-8">
              {!isPro
                ? "Upgrade to Pro to start using Rate Limits"
                : "No Rate Limit Data Found"}
            </p>
            <p className="text-sm text-gray-500 max-w-sm mt-2">
              View our documentation to learn how to use rate limiting.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="https://docs.helicone.ai/features/advanced-usage/custom-rate-limits"
                className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <BookOpenIcon className="h-4 w-4" />
                View Docs
              </Link>
              {!isPro && (
                <Link href="/settings/billing">
                  <Button className="bg-sky-500 hover:bg-sky-600">
                    Start free trial
                  </Button>
                </Link>
              )}
            </div>
            {isPro && (
              <div>
                <Divider>Or</Divider>

                <div className="mt-4">
                  <h3 className="text-xl text-black dark:text-white font-semibold">
                    TS/JS Quick Start
                  </h3>
                  <DiffHighlight
                    code={`
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Property-IP": "111.1.1.1",
    "Helicone-RateLimit-Policy": "10;w=1000;u=cents;s=user", // add this header and set the header value
  },
});
const openai = new OpenAIApi(configuration);

const response = await openai.createCompletion({
  model: "text-davinci-003",
  prompt: "How do I set custom rate limits?",
});
`}
                    language="typescript"
                    newLines={[]}
                    oldLines={[]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
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

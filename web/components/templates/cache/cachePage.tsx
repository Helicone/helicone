import {
  BanknotesIcon,
  CircleStackIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  useCacheOvertime,
  useCachePageMetrics,
  useCachePageTopMetrics,
  useCachePageTopRequests,
} from "../../../services/hooks/useCachePage";
import { MetricsPanel } from "../../shared/metrics/metricsPanel";
import { StackedBarChart } from "../../shared/metrics/stackedBarChart";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedListItem from "../../shared/themed/themedListItem";
import RequestsPageV2 from "../requestsV2/requestsPageV2";
import { SortDirection } from "../../../services/lib/sorts/requests/sorts";
import ModelPill from "../requestsV2/modelPill";

interface CachePageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

const CachePage = (props: CachePageProps) => {
  const { currentPage, pageSize, sort } = props;

  const data = useCachePageMetrics();
  const cacheOverTime = useCacheOvertime();
  const topMetrics = useCachePageTopMetrics();
  const topRequests = useCachePageTopRequests();

  const [selectedRequest, setSelectedRequest] = useState<{
    request_id: string;
    count: number;
    last_used: Date;
    first_used: Date;
    prompt: string;
    model: string;
  }>();
  const [open, setOpen] = useState<boolean>(false);

  const hasCache = data.totalCached.data?.data
    ? +data.totalCached.data?.data === 0
    : false;

  const metrics = [
    {
      id: "caches",
      label: "All Time Caches",
      value: data.totalCached.data?.data || 0,
      isLoading: data.totalCached.isLoading,
      icon: CircleStackIcon,
    },
    {
      id: "savings",
      label: "All Time Savings",
      value: data.totalSavings.data?.data
        ? `$${
            data.totalSavings.data?.data < 1
              ? data.totalSavings.data?.data.toFixed(5)
              : data.totalSavings.data?.data.toFixed(2)
          }`
        : "$0.00",
      isLoading: data.totalSavings.isLoading,
      icon: BanknotesIcon,
    },
    {
      id: "time-saved",
      label: "Total Time Saved",
      value: data.totalTimeSaved.data?.data
        ? `${data.totalTimeSaved.data?.data}s`
        : "0s",
      isLoading: data.totalTimeSaved.isLoading,
      icon: ClockIcon,
    },
  ];

  const cacheData = cacheOverTime.overTime.data?.data ?? [];

  const timeMap = (x: Date) => new Date(x).toDateString();

  const chartData = cacheData.map((d) => ({
    ...d,
    time: timeMap(d.time),
  }));

  const getCacheModels = () => {
    const cacheModels = new Set<string>();
    chartData.forEach((d) => {
      Object.keys(d).forEach((key) => {
        if (key !== "time") {
          cacheModels.add(key);
        }
      });
    });
    const cacheModelsArray = Array.from(cacheModels);
    cacheModelsArray.sort();
    return cacheModelsArray;
  };

  const cacheModels = getCacheModels();

  const cacheDist =
    topMetrics.topModels.data?.data?.map((x) => ({
      name: x.model,
      value: +x.count,
    })) ?? [];

  cacheDist.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="flex flex-col space-y-4 w-full">
        {hasCache ? (
          <a
            type="button"
            href="https://docs.helicone.ai/advanced-usage/caching"
            target="_blank"
            rel="noreferrer noopener"
            className="relative block w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 p-12 text-center focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-700 dark:text-gray-300"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
              />
            </svg>
            <span className="mt-2 block text-lg font-semibold text-gray-900 dark:text-gray-100">
              Click here to view our docs on how to enable caching
            </span>
          </a>
        ) : (
          <div className="gap-4 grid grid-cols-8">
            <div className="col-span-8 md:col-span-3 grid grid-cols-1 text-gray-900 gap-4">
              {metrics.map((metric, i) => (
                <MetricsPanel metric={metric} key={i} hFull={true} />
              ))}
            </div>
            <div className="col-span-8 md:col-span-5 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg">
              <div className="flex flex-col space-y-4 py-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                  Caches last 30 days
                </h3>
                <div className="h-72 px-4">
                  {cacheOverTime.overTime.isLoading ? (
                    <div className="h-full w-full flex-col flex p-8">
                      <div className="h-full w-full rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
                    </div>
                  ) : (
                    <StackedBarChart data={chartData} keys={cacheModels} />
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-8 md:col-span-8 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg h-96">
              <div className="flex flex-col space-y-4 py-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                  Top Requests
                </h3>
                <ul className="h-72 px-4 overflow-auto divide-y divide-gray-300 dark:divide-gray-700">
                  {topRequests.topRequests.data?.data?.map((request, i) => (
                    <ThemedListItem
                      key={i}
                      onClickHandler={() => {
                        setSelectedRequest(request);
                        setOpen(true);
                      }}
                      title={request.prompt}
                      subtitle={`Created: ${new Date(
                        request.first_used
                      ).toLocaleString()}`}
                      icon={CircleStackIcon}
                      value={request.count}
                      pill={<ModelPill model={request.model} />}
                      secondarySubtitle={`Recent: ${new Date(
                        request.last_used
                      ).toLocaleString()}`}
                    />
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-span-8 pt-8">
              <RequestsPageV2
                currentPage={currentPage}
                pageSize={pageSize}
                sort={sort}
                isCached={true}
              />
            </div>
          </div>
        )}
      </div>
      <ThemedDrawer open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-2">
          <p className="text-gray-500 text-sm border p-2 rounded-lg border-red-300 dark:border-red-700">
            Cache Bucket response configurable soon...
          </p>
          <dl className="mt-2 grid grid-cols-2">
            <div className="col-span-2 flex flex-row justify-between py-2 items-center text-sm font-medium border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-col">
                <dt className="text-gray-500">Request ID</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedRequest?.request_id}
                </dd>
              </div>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Model</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                <ModelPill model={selectedRequest?.model ?? ""} />
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Cache Hits</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {selectedRequest?.count}
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">First Used</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(selectedRequest?.first_used || "").toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Last Used</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(selectedRequest?.last_used || "").toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="w-full flex flex-col text-left space-y-1 mb-4 pt-8">
            <p className="text-gray-500 text-sm font-medium">Request</p>
            <p className="text-gray-900 dark:text-gray-100 p-2 border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
              {selectedRequest?.prompt || "n/a"}
            </p>
          </div>
        </div>
      </ThemedDrawer>
    </>
  );
};

export default CachePage;

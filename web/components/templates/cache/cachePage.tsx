import { useOrg } from "@/components/layout/org/organizationContext";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import {
  BanknotesIcon,
  BookOpenIcon,
  CircleStackIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { BarChart } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { TimeFilter } from "../../../services/lib/filters/filterDefs";
import { SortDirection } from "../../../services/lib/sorts/requests/sorts";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedTable from "../../shared/themed/table/themedTable";
import UpgradeProModal from "../../shared/upgradeProModal";
import ModelPill from "../requests/modelPill";
import UnauthorizedView from "../requests/UnauthorizedView";
import { formatNumber } from "../users/initialColumns";
import { useCachePageClickHouse } from "./useCachePage";
import { formatTimeSaved } from "@/lib/timeCalculations/time";
import FoldedHeader from "@/components/shared/FoldedHeader";
import { ColumnDef } from "@tanstack/react-table";
import { columnDefsToDragColumnItems } from "../../shared/themed/table/columns/DragList";
import RenderHeliconeRequest from "../requests/RenderHeliconeRequest";
import { HeliconeRequest } from "@helicone-package/llm-mapper/types";

interface CachePageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex: string;
}

type CacheRequest = {
  id: string;
  request_id: string;
  count: number;
  last_used: Date;
  first_used: Date;
  prompt: string;
  model: string;
  response: string;
};

type SelectedCachedRequest = {
  request_id: string;
  count: number;
  last_used: Date;
  first_used: Date;
  model: string;
  sourceRequest: HeliconeRequest;
};

const topRequestsColumns: ColumnDef<CacheRequest>[] = [
  {
    accessorKey: "prompt",
    header: "Request",
    cell: (info) => (
      <div className="max-w-[300px] truncate text-gray-900 dark:text-gray-100 font-medium">
        {info.getValue() as string}
      </div>
    ),
    minSize: 300,
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: (info) => <ModelPill model={info.getValue() as string} />,
    minSize: 150,
  },
  {
    accessorKey: "count",
    header: "Cache Hits",
    cell: (info) => (
      <span className="font-semibold">{info.getValue() as number}</span>
    ),
    minSize: 100,
  },
  {
    accessorKey: "first_used",
    header: "First Used",
    cell: (info) => (
      <span className="text-sm text-muted-foreground">
        {new Date(info.getValue() as Date).toLocaleString()}
      </span>
    ),
    minSize: 150,
  },
  {
    accessorKey: "last_used",
    header: "Last Used",
    cell: (info) => (
      <span className="text-sm text-muted-foreground">
        {new Date(info.getValue() as Date).toLocaleString()}
      </span>
    ),
    minSize: 150,
  },
];

const CachePage = (props: CachePageProps) => {
  const { currentPage, pageSize, sort, defaultIndex = "0" } = props;
  const [timePeriod, setTimePeriod] = useState<number>(30);
  const [timeFilter, _] = useState<TimeFilter>({
    start: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * timePeriod),
    end: new Date(),
  });

  const currentTimeFilter = useMemo<TimeFilter>(
    () => ({
      start: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * timePeriod),
      end: new Date(),
    }),
    [timePeriod]
  );

  const timeZoneDifference = new Date().getTimezoneOffset();
  const router = useRouter();
  const dbIncrement = "day";
  const {
    overTimeData,
    metrics: chMetrics,
    isAnyLoading,
  } = useCachePageClickHouse({
    timeFilter: currentTimeFilter,
    timeZoneDifference,
    dbIncrement,
  });

  const [selectedRequest, setSelectedRequest] = useState<SelectedCachedRequest>();
  const [open, setOpen] = useState<boolean>(false);
  const [openUpgradeModal, setOpenUpgradeModal] = useState<boolean>(false);
  const heliconeAuthClient = useHeliconeAuthClient();
  const org = useOrg();
  const {
    unauthorized,
    currentTier,
    isLoading: isLoadingUnauthorized,
  } = useGetUnauthorized(heliconeAuthClient?.user?.id || "");

  const hasCache = useMemo(() => {
    if (isAnyLoading) return null;
    const cacheHits = chMetrics.totalCacheHits.data?.data;
    if (cacheHits === undefined || cacheHits === null) {
      return false;
    }
    return +cacheHits > 0;
  }, [chMetrics.totalCacheHits.data?.data, isAnyLoading]);

  const shouldShowUnauthorized = hasCache && unauthorized;

  const isLoading = isAnyLoading || isLoadingUnauthorized;

  const topRequestsData: CacheRequest[] = useMemo(() => {
    return (chMetrics.topRequests.data?.data ?? []).map(
      (request: any, index: number) => ({
        id: index.toString(),
        request_id: request.request_id,
        count: request.count,
        last_used: new Date(request.last_used),
        first_used: new Date(request.first_used),
        prompt: request.prompt,
        model: request.model,
        response: request.response,
      })
    );
  }, [chMetrics.topRequests.data?.data]);

  const [activeColumns, setActiveColumns] = useState(
    columnDefsToDragColumnItems(topRequestsColumns)
  );

  const cacheHitRate = useMemo(() => {
    const cacheHits = chMetrics.totalCacheHits.data?.data;
    const totalRequests = chMetrics.totalRequests.data?.data;

    return cacheHits && totalRequests ? (cacheHits / totalRequests) * 100 : 0;
  }, [chMetrics.totalCacheHits.data?.data, chMetrics.totalRequests.data?.data]);

  const avgLatencyReduction = useMemo(() => {
    const avgLatency = chMetrics.avgLatency.data?.data;
    const avgLatencyCached = chMetrics.avgLatencyCached.data?.data;
    return avgLatency && avgLatencyCached ? avgLatency - avgLatencyCached : 0;
  }, [chMetrics.avgLatency.data?.data, chMetrics.avgLatencyCached.data?.data]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingAnimation title="Loading cache data..." />
      </div>
    );
  }

  if (!org?.currentOrg?.tier) {
    return null;
  }

  if (hasCache === false) {
    return (
      <div className="flex flex-col w-full h-screen bg-background dark:bg-sidebar-background">
        <div className="flex flex-1 h-full">
          <EmptyStateCard feature="cache" />
        </div>
      </div>
    );
  }

  const metrics = [
    {
      id: "caches",
      label: "Total Cache Hits",
      value: `${chMetrics.totalCacheHits.data?.data ?? 0} hits`,
      isLoading: isAnyLoading,
      icon: CircleStackIcon,
    },
    {
      id: "savings",
      label: "Cost Savings",
      value: `$${formatNumber(chMetrics.totalSavings.data?.data ?? 0)}`,
      isLoading: isAnyLoading,
      icon: BanknotesIcon,
    },
    {
      id: "time-saved",
      label: "Time Saved",
      value: formatTimeSaved(chMetrics.timeSaved.data?.data ?? 0),
      isLoading: isAnyLoading,
      icon: ClockIcon,
    },
  ];

  const cacheData = overTimeData.cacheHits.data?.data ?? [];

  const chartData = cacheData.map((d) => ({
    ...d,
    date: getTimeMap("day")(new Date(d.time)),
  }));

  if (shouldShowUnauthorized) {
    return (
      <UnauthorizedView currentTier={currentTier || ""} pageType="cache" />
    );
  }

  return (
    <>
      <FoldedHeader
        showFold={false}
        leftSection={
          <section className="flex flex-row items-center gap-4">
            <div className="font-semibold">Cache</div>
            <Select
              value={timePeriod.toString()}
              onValueChange={(value) => setTimePeriod(Number(value))}
            >
              <SelectTrigger className="w-[160px] h-8 shadow-sm">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </section>
        }
        rightSection={
          <section className="flex flex-row items-center gap-2">
            <Link
              href="https://docs.helicone.ai/features/advanced-usage/caching"
              target="_blank"
              rel="noreferrer noopener"
              className="h-8 bg-muted rounded-lg border border-border p-2 flex items-center gap-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <BookOpenIcon className="h-4 w-4" />
            </Link>
          </section>
        }
      />

      <section className="w-full px-4 pt-2">
        <div className="w-full border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950 p-4 text-sm rounded-lg text-orange-800 dark:text-orange-200">
          We reworked our caching system on May 22nd, 2025 at 4:30PM PST. Reach
          out to us to restore any cache data prior to the change.
        </div>
      </section>

      <section className={`dark:border-border w-full px-4 pb-2`}>
        <div className="py-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Total Cache Hits */}
            <div className="bg-card border border-border rounded-lg p-4 flex flex-row items-center gap-4">
              <CircleStackIcon className="h-6 w-6 text-sky-500" />
              <div className="flex flex-col">
                <div className="text-sm text-muted-foreground">
                  Total Cache Hits
                </div>
                {isAnyLoading ? (
                  <div className="animate-pulse h-7 w-16 bg-muted rounded" />
                ) : (
                  <div className="text-xl font-semibold text-foreground">
                    {`${chMetrics.totalCacheHits.data?.data ?? 0} hits`}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex flex-row items-center gap-4">
              <BanknotesIcon className="h-6 w-6 text-sky-500" />
              <div className="flex flex-col">
                <div className="text-sm text-muted-foreground">
                  Total Cost Savings
                </div>
                {isAnyLoading ? (
                  <div className="animate-pulse h-7 w-16 bg-muted rounded" />
                ) : (
                  <div className="text-xl font-semibold text-foreground">
                    ${formatNumber(chMetrics.totalSavings.data?.data ?? 0, 3)}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex flex-row items-center gap-4">
              <ClockIcon className="h-6 w-6 text-sky-500" />
              <div className="flex flex-col">
                <div className="text-sm text-muted-foreground">
                  Total Time Saved
                </div>
                {isAnyLoading ? (
                  <div className="animate-pulse h-7 w-16 bg-muted rounded" />
                ) : (
                  <div className="text-xl font-semibold text-foreground">
                    {formatTimeSaved(chMetrics.timeSaved.data?.data ?? 0)}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex flex-row items-center gap-4">
              <CircleStackIcon className="h-6 w-6 text-sky-500" />
              <div className="flex flex-col">
                <div className="text-sm text-muted-foreground">
                  Cache Hit Rate
                </div>
                {isAnyLoading ? (
                  <div className="animate-pulse h-7 w-16 bg-muted rounded" />
                ) : (
                  <div
                    className={`text-xl font-semibold ${
                      cacheHitRate > 10 ? "text-green-600" : "text-foreground"
                    }`}
                  >
                    {cacheHitRate.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex flex-row items-center gap-4">
              <ClockIcon className="h-6 w-6 text-sky-500" />
              <div className="flex flex-col">
                <div className="text-sm text-muted-foreground">
                  Time Saved per Hit
                </div>
                {isAnyLoading ? (
                  <div className="animate-pulse h-7 w-16 bg-muted rounded" />
                ) : (
                  <div className="text-xl font-semibold text-green-600">
                    {/* Calculate time saved per hit: 709ms - 42ms = 667ms */}
                    {`-${formatTimeSaved(avgLatencyReduction)}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`dark:border-border w-full border-t px-4 py-2 bg-white`}
      >
        <div className="py-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">{`Cache Hits (Last ${timePeriod} days)`}</h2>
          <div className="h-72 px-4 ">
            {isAnyLoading ? (
              <div className="h-full w-full flex-col flex p-8">
                <div className="h-full w-full rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
              </div>
            ) : (
              <div className="h-full w-full">
                <BarChart
                  data={chartData}
                  categories={["count"]}
                  index={"date"}
                  className="h-full -ml-4 pt-4"
                  colors={["blue"]}
                  showLegend={false}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={`dark:border-border w-full border-t py-2`}>
        <div className="py-4">
          <h2 className="text-lg font-semibold text-foreground px-4 mb-4">
            Top Requests
          </h2>
          <div className="border-t">
            <ThemedTable
              id="cache-top-requests"
              defaultData={topRequestsData}
              defaultColumns={topRequestsColumns}
              skeletonLoading={isAnyLoading}
              dataLoading={isAnyLoading}
              activeColumns={activeColumns}
              setActiveColumns={setActiveColumns}
              fullWidth={true}
              onRowSelect={(row) => {
                const sourceRequest = chMetrics.topSourceRequestsWithBodies.requests.requests.find(
                  (req: any) => req.request_id === row.request_id
                );
                
                if (sourceRequest) {
                  setSelectedRequest({
                    request_id: row.request_id,
                    count: row.count,
                    last_used: row.last_used,
                    first_used: row.first_used,
                    model: row.model,
                    sourceRequest: sourceRequest,
                  });
                  setOpen(true);
                }
              }}
            />
          </div>
        </div>
      </section>

      <ThemedDrawer open={open} setOpen={setOpen}>
        {selectedRequest ? (
          <div className="flex flex-col space-y-2">
            <p className="text-gray-500 text-sm border p-2 rounded-lg border-red-300 dark:border-red-700">
              Cache Bucket response configurable soon...
            </p>
            <dl className="mt-2 grid grid-cols-2">
              <div className="col-span-2 flex flex-row justify-between py-2 items-center text-sm font-medium border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col">
                  <dt className="text-gray-500">Request ID</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {selectedRequest.request_id}
                  </dd>
                </div>
              </div>
              <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
                <dt className="text-gray-500">Model</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  <ModelPill model={selectedRequest.model} />
                </dd>
              </div>
              <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
                <dt className="text-gray-500">Cache Hits</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedRequest.count}
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
            
            <div className="flex-1 min-h-0">
              <RenderHeliconeRequest heliconeRequest={selectedRequest.sourceRequest} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <p className="text-gray-500 text-sm">No request data available</p>
          </div>
        )}
      </ThemedDrawer>
      <UpgradeProModal open={openUpgradeModal} setOpen={setOpenUpgradeModal} />
    </>
  );
};

export default CachePage;

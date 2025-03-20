import { useOrg } from "@/components/layout/org/organizationContext";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { IslandContainer } from "@/components/ui/islandContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BanknotesIcon,
  BookOpenIcon,
  CircleStackIcon,
  ClockIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import { BarChart } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ElementType, useMemo, useState } from "react";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { useGetUnauthorized } from "../../../services/hooks/dashboard";
import { TimeFilter } from "../../../services/lib/filters/filterDefs";
import { SortDirection } from "../../../services/lib/sorts/requests/sorts";
import AuthHeader from "../../shared/authHeader";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedListItem from "../../shared/themed/themedListItem";
import UpgradeProModal from "../../shared/upgradeProModal";
import ModelPill from "../requests/modelPill";
import RequestsPage from "../requests/RequestsPage";
import UnauthorizedView from "../requests/UnauthorizedView";
import { formatNumber } from "../users/initialColumns";
import { useCachePageClickHouse } from "./useCachePage";

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

const tabs: {
  id: number;
  title: string;
  icon: ElementType<any>;
}[] = [
  {
    id: 0,
    title: "Cache Analytics",
    icon: CircleStackIcon,
  },
  {
    id: 1,
    title: "Logs",
    icon: TableCellsIcon,
  },
];

const CachePage = (props: CachePageProps) => {
  const { currentPage, pageSize, sort, defaultIndex = "0" } = props;
  const [timeFilter, _] = useState<TimeFilter>({
    start: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30),
    end: new Date(),
  });
  const timeZoneDifference = new Date().getTimezoneOffset();
  const router = useRouter();
  const dbIncrement = "day";
  const {
    overTimeData,
    metrics: chMetrics,
    isAnyLoading,
  } = useCachePageClickHouse({
    timeFilter,
    timeZoneDifference,
    dbIncrement,
  });

  const [selectedRequest, setSelectedRequest] = useState<{
    request_id: string;
    count: number;
    last_used: Date;
    first_used: Date;
    prompt: string;
    model: string;
  }>();
  const [open, setOpen] = useState<boolean>(false);
  const [openUpgradeModal, setOpenUpgradeModal] = useState<boolean>(false);
  const user = useUser();
  const org = useOrg();
  const {
    unauthorized,
    currentTier,
    isLoading: isLoadingUnauthorized,
  } = useGetUnauthorized(user?.id || "");

  const hasCache = useMemo(() => {
    const cacheHits = chMetrics.totalCacheHits.data?.data;
    if (cacheHits === undefined || cacheHits === null) {
      return false;
    }
    return +cacheHits > 0;
  }, [chMetrics.totalCacheHits.data?.data]);

  const shouldShowUnauthorized = hasCache && unauthorized;

  const isLoading = isAnyLoading || isLoadingUnauthorized;

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

  if (!hasCache && !isLoading) {
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
      label: "All Time Caches",
      value: `${chMetrics.totalCacheHits.data?.data ?? 0} hits`,
      isLoading: isAnyLoading,
      icon: CircleStackIcon,
    },
    {
      id: "savings",
      label: "All Time Savings",
      value: `$${formatNumber(chMetrics.totalSavings.data?.data ?? 0)}`,
      isLoading: isAnyLoading,
      icon: BanknotesIcon,
    },
    {
      id: "time-saved",
      label: "Total Time Saved",
      value: `${chMetrics.timeSaved.data?.data ?? 0} s`,
      isLoading: isAnyLoading,
      icon: ClockIcon,
    },
  ];

  const cacheData = overTimeData.cacheHits.data?.data ?? [];

  const chartData = cacheData.map((d) => ({
    ...d,
    date: getTimeMap("day")(new Date(d.time)),
  }));

  const cacheDist =
    chMetrics.topModels?.data?.data?.map((x: any) => ({
      name: x.model,
      value: +x.count,
    })) ?? [];

  cacheDist.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return (
    <IslandContainer>
      <AuthHeader
        isWithinIsland={true}
        title={<div className="flex items-center gap-2">Cache</div>}
        actions={
          <Link
            href="https://docs.helicone.ai/features/advanced-usage/caching"
            target="_blank"
            rel="noreferrer noopener"
            className="w-fit flex items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <BookOpenIcon className="h-4 w-4" />
          </Link>
        }
      />
      <div className="flex flex-col">
        {shouldShowUnauthorized ? (
          <UnauthorizedView currentTier={currentTier || ""} pageType="cache" />
        ) : (
          <Tabs defaultValue={defaultIndex} className="w-full">
            <TabsList className="font-semibold">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id.toString()}
                  onClick={() => {
                    router.push(
                      {
                        query: { ...router.query, tab: tab.id },
                      },
                      undefined,
                      { shallow: true }
                    );
                  }}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="0">
              <div className="flex flex-col xl:flex-row gap-4 w-full py-4">
                <div className="flex flex-col space-y-4 w-full xl:w-1/2">
                  <ul className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    {metrics.map((metric, i) => (
                      <li
                        key={i}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-4 flex flex-row rounded-lg items-center gap-4"
                      >
                        <metric.icon className="h-6 w-6 text-sky-500" />
                        <div className="flex flex-col">
                          <dt className="text-gray-500 text-sm">
                            {metric.label}
                          </dt>
                          {metric.isLoading ? (
                            <div className="animate-pulse h-7 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                          ) : (
                            <dd className="text-gray-900 dark:text-gray-100 text-xl font-semibold">
                              {metric.value}
                            </dd>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col space-y-4 py-6 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                      Caches last 30 days
                    </h3>
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
                </div>
                <div
                  className="flex flex-col w-full xl:w-1/2
space-y-4 py-6 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg h-[30rem]"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                    Top Requests
                  </h3>
                  <ul className="h-auto px-4 overflow-auto divide-y divide-gray-300 dark:divide-gray-700">
                    {chMetrics.topRequests.data?.data?.map(
                      (request: any, i: any) => (
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
                      )
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="1">
              <div className="py-4">
                {hasCache && unauthorized ? (
                  <UnauthorizedView
                    currentTier={currentTier || ""}
                    pageType="cache"
                  />
                ) : (
                  <RequestsPage
                    currentPage={currentPage}
                    pageSize={pageSize}
                    sort={sort}
                    isCached={true}
                    currentFilter={null}
                    organizationLayout={null}
                    organizationLayoutAvailable={false}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
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
      <UpgradeProModal open={openUpgradeModal} setOpen={setOpenUpgradeModal} />
    </IslandContainer>
  );
};

export default CachePage;

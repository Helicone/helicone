import {
  BanknotesIcon,
  BookOpenIcon,
  CircleStackIcon,
  ClockIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { ElementType, useMemo, useState } from "react";
import {
  BarChart,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Divider,
  Badge,
} from "@tremor/react";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedListItem from "../../shared/themed/themedListItem";
import RequestsPageV2 from "../requestsV2/requestsPageV2";
import { SortDirection } from "../../../services/lib/sorts/requests/sorts";
import ModelPill from "../requestsV2/modelPill";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { TimeFilter } from "../../../lib/api/handlerWrappers";
import { useCachePageClickHouse } from "./useCachePage";
import UpgradeProModal from "../../shared/upgradeProModal";
import Link from "next/link";
import { useRouter } from "next/router";
import AuthHeader from "../../shared/authHeader";
import { formatNumber } from "../users/initialColumns";
import { useOrg } from "@/components/layout/organizationContext";
import { DiffHighlight } from "../welcome/diffHighlight";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { IslandContainer } from "@/components/ui/islandContainer";

interface CachePageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex?: number;
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
  const { currentPage, pageSize, sort, defaultIndex = 0 } = props;
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

  const hasCache = useMemo(() => {
    return chMetrics.totalCacheHits.data?.data !== undefined &&
      chMetrics.totalCacheHits.data?.data !== null
      ? +chMetrics.totalCacheHits.data?.data > 0
      : true;
  }, [chMetrics.totalCacheHits.data?.data]);

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

  const org = useOrg();
  const isPro = org?.currentOrg?.tier !== "free";

  return (
    <IslandContainer>
      <AuthHeader
        title={
          <div className="flex items-center gap-2">
            Cache <Badge size="sm">Beta</Badge>
          </div>
        }
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

      {!isPro ? (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <FeatureUpgradeCard
            title="Unlock Cache"
            description="The Free plan does not include the Cache feature, but getting access is easy."
            infoBoxText="Optimize your LLM usage by caching responses and reducing redundant API calls."
            youtubeVideo="https://www.youtube.com/embed/qIOq_NbeQ28?autoplay=1&mute=1"
            documentationLink="https://docs.helicone.ai/features/advanced-usage/caching"
          />
        </div>
      ) : !hasCache ? (
        <div className="flex flex-col w-full mt-16 justify-center items-center">
          <div className="flex flex-col">
            <div className="w-fit pt-2 pl-0.5 bg-white border border-gray-300 rounded-md">
              <CircleStackIcon className="h-10 w-10 flex items-center justify-center ml-2 text-gray-500" />
            </div>

            <p className="text-xl text-black dark:text-white font-semibold mt-8">
              {!isPro
                ? "Upgrade to Pro to start using Cache"
                : "No Cache Data Found"}
            </p>
            <p className="text-sm text-gray-500 max-w-sm mt-2">
              View our documentation to learn how to use caching.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="https://docs.helicone.ai/features/advanced-usage/caching"
                className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <BookOpenIcon className="h-4 w-4" />
                View Docs
              </Link>
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
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": \`Bearer ${process.env.HELICONE_API_KEY}\`,
  },
});

openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        content: "Generate an abstract for a course on space.",
      },
    ],
    model: "gpt-4",
  },
  {
    headers: {
      "Helicone-Cache-Enabled": "true",
    },
  }
);
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
        <div className="flex flex-col">
          <TabGroup defaultIndex={defaultIndex}>
            <TabList className="font-semibold" variant="line">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  icon={tab.icon}
                  onClick={() => {
                    router.push(
                      {
                        query: { tab: tab.id },
                      },
                      undefined,
                      { shallow: true }
                    );
                  }}
                >
                  {tab.title}
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              <TabPanel>
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
                  <div className="flex flex-col w-full xl:w-1/2 space-y-4 py-6 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg h-[30rem]">
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
              </TabPanel>
              <TabPanel>
                <div className="py-4">
                  <RequestsPageV2
                    currentPage={currentPage}
                    pageSize={pageSize}
                    sort={sort}
                    isCached={true}
                    currentFilter={null}
                    organizationLayout={null}
                    organizationLayoutAvailable={false}
                  />
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      )}

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

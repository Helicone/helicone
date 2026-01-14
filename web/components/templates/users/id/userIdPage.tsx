import { IslandContainer } from "@/components/ui/islandContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemedLineChart } from "@/components/ui/themedLineChart";
import {
  PresentationChartLineIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { ElementType } from "react";
import { useUserId } from "../../../../services/hooks/users";
import LoadingAnimation from "../../../shared/loadingAnimation";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import RequestsPage from "../../requests/RequestsPage";
import { formatNumber } from "../initialColumns";

interface UserIdPageProps {
  userId: string;
  defaultIndex?: number;
}

const tabs: {
  id: number;
  title: string;
  icon: ElementType<any>;
}[] = [
  {
    id: 0,
    title: "Usage",
    icon: PresentationChartLineIcon,
  },
  {
    id: 1,
    title: "Logs",
    icon: TableCellsIcon,
  },
];

const UserIdPage = (props: UserIdPageProps) => {
  const { userId, defaultIndex = 0 } = props;

  const { user, isLoading, costOverTime, requestOverTime } = useUserId(userId);
  const router = useRouter();

  return (
    <IslandContainer className="py-10">
      <div className="flex w-full flex-col items-start space-y-4">
        <HcBreadcrumb
          pages={[
            {
              href: "/users",
              name: "Users",
            },
            {
              href: `/users/${userId}`,
              name: userId,
            },
            // {},
          ]}
        />
        <div className="flex w-full justify-between">
          <div className="flex items-end gap-4">
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              {userId}
            </h1>
          </div>
        </div>
      </div>

      <>
        {isLoading ? (
          <LoadingAnimation />
        ) : !user ? (
          <div className="grid w-full grid-cols-10 gap-8 pt-8">
            <div className="col-span-12 flex w-full flex-col items-start space-y-4 pt-2 md:col-span-3">
              <p className="text-sm text-gray-500">User not found</p>
            </div>
          </div>
        ) : (
          <div className="grid w-full grid-cols-10 gap-8 pt-8">
            <div className="col-span-12 flex w-full flex-col items-start space-y-4 pt-2 md:col-span-3">
              <div className="flex w-full flex-col space-y-2 divide-y divide-gray-200 text-black dark:divide-gray-800 dark:text-white">
                <p className="text-md font-semibold">Overview (Last 30 days)</p>
                <div className="flex w-full flex-wrap justify-between gap-2 pr-4 pt-4">
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Total Cost</p>
                    <p className="text-sm text-gray-500">
                      ${formatNumber(Number(user?.cost ?? 0), 6)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Total Requests</p>
                    <p className="text-sm text-gray-500">
                      {user?.total_requests}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Active For</p>
                    <p className="text-sm text-gray-500">
                      {user.active_for} day{user.active_for > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col space-y-2 divide-y divide-gray-200 pt-8 text-black dark:divide-gray-800 dark:text-white">
                <p className="text-md font-semibold">Details (Last 30 days)</p>
                <div className="flex flex-col space-y-4 pr-4 pt-4">
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">First Active</p>
                    <p className="text-sm text-gray-500">
                      {new Date(user.first_active).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Last Active</p>
                    <p className="text-sm text-gray-500">
                      {new Date(user.last_active).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">
                      Average Requests per day
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(user.average_requests_per_day_active)}
                    </p>
                  </div>{" "}
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">
                      Average Tokens per request
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(user.average_tokens_per_request)}
                    </p>
                  </div>{" "}
                </div>
              </div>
            </div>
            <div className="col-span-12 flex h-full w-full flex-col md:col-span-7">
              <Tabs defaultValue={defaultIndex.toString()} className="w-full">
                <TabsList>
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id.toString()}
                      onClick={() => {
                        const { id, page, t } = router.query;
                        router.replace(
                          {
                            pathname: `/users/[id]`,
                            query: { id, page, t, tab: tab.id },
                          },
                          undefined,
                          { shallow: true },
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="0">
                  <div className="flex flex-col space-y-4 py-4">
                    <StyledAreaChart
                      title={"Requests last 30 days"}
                      value={undefined}
                      isDataOverTimeLoading={isLoading}
                      height={"200px"}
                    >
                      <ThemedLineChart
                        data={requestOverTime ?? []}
                        index="date"
                        categories={["requests"]}
                        colors={["chart1"]}
                        height="200px"
                      />
                    </StyledAreaChart>
                    <StyledAreaChart
                      title={"Costs in the last 30 days"}
                      value={undefined}
                      isDataOverTimeLoading={isLoading}
                      height={"200px"}
                    >
                      <ThemedLineChart
                        data={costOverTime ?? []}
                        index="date"
                        categories={["cost"]}
                        colors={["chart2"]}
                        height="200px"
                        valueFormatter={(value: number) =>
                          `$${formatNumber(value, 6)}`
                        }
                      />
                    </StyledAreaChart>
                  </div>
                </TabsContent>
                <TabsContent value="1">
                  <div className="py-2">
                    <RequestsPage
                      currentPage={1}
                      pageSize={25}
                      sort={{
                        sortKey: null,
                        sortDirection: null,
                        isCustomProperty: false,
                      }}
                      userId={userId}
                      organizationLayoutAvailable={false}
                      showSelection={false}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </>
    </IslandContainer>
  );
};

export default UserIdPage;

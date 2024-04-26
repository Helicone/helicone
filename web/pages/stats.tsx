import { useQuery } from "@tanstack/react-query";
import BasePageV2 from "../components/layout/basePageV2";
import MetaData from "../components/layout/public/authMetaData";
import { BarChart } from "@tremor/react";
import { Result } from "../lib/result";
import { HeliconeStats } from "./api/stats";
import { getTimeMap } from "../lib/timeCalculations/constants";

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;
  const { isLoading, data } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const response = await fetch("/api/stats", {
        next: { revalidate: 1000 },
      });
      return (await response.json()) as Result<HeliconeStats, string>;
    },
  });

  const activeOrgMonth =
    data?.data?.monthlyActiveUsers
      .map((v) => ({
        time_step: new Date(v.time_step),
        user_count_step: +v.user_count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.user_count_step,
      })) ?? [];

  const activeOrgWeek =
    data?.data?.weeklyActiveUsers
      .map((v) => ({
        time_step: new Date(v.time_step),
        user_count_step: +v.user_count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.user_count_step,
      })) ?? [];

  const activeOrgDay =
    data?.data?.dailyActiveUsers
      .map((v) => ({
        time_step: new Date(v.time_step),
        user_count_step: +v.user_count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.user_count_step,
      })) ?? [];

  const totalUsers =
    data?.data?.integratedUsers
      .map((v) => ({
        time_step: new Date(v.time_step),
        count_step: +v.count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.count_step,
      })) ?? [];

  const userGrowthPerMonth =
    data?.data?.growthPerMonth
      .map((v) => ({
        time_step: new Date(v.time_step),
        count_step: +v.count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(
          new Date(
            v.time_step.getTime() +
              new Date(v.time_step).getDate() * 24 * 60 * 60 * 1000 // add the number of days in the month
          )
        ),
        value: v.count_step,
      })) ?? [];

  const userGrowthPerWeek =
    data?.data?.growthPerWeek
      .map((v) => ({
        time_step: new Date(v.time_step),
        count_step: +v.count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.count_step,
      })) ?? [];

  const userGrowthPerDay =
    data?.data?.growthOverTime
      .map((v) => ({
        time_step: new Date(v.time_step),
        count_step: +v.count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.count_step,
      })) ?? [];

  const weeklyActiveUsers =
    data?.data?.weeklyActiveUsers
      .map((v) => ({
        time_step: new Date(v.time_step),
        request_count_step: +v.request_count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.request_count_step,
      })) ?? [];

  const dailyActiveUsers =
    data?.data?.dailyActiveUsers
      .map((v) => ({
        time_step: new Date(v.time_step),
        request_count_step: +v.request_count_step,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.request_count_step,
      })) ?? [];

  const monthlyRetentionRate =
    data?.data?.monthlyRetentionRate
      .map((v) => ({
        time_step: new Date(v.time_step),
        rate: +v.rate,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(
          new Date(
            v.time_step.getTime() +
              new Date(v.time_step).getDate() * 24 * 60 * 60 * 1000 // add the number of days in the month
          )
        ),
        value: v.rate,
      })) ?? [];

  const weeklyRetentionRate =
    data?.data?.weeklyRetentionRate
      .map((v) => ({
        time_step: new Date(v.time_step),
        rate: +v.rate,
      }))
      .sort((a, b) => a.time_step.getTime() - b.time_step.getTime())
      .map((v) => ({
        time: getTimeMap("day")(new Date(v.time_step)),
        value: v.rate,
      })) ?? [];

  return (
    <MetaData title="Home">
      <BasePageV2>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            <h1 className="text-3xl font-bold text-center">
              Active Orgs/Month
            </h1>
            <div className="h-96">
              <BarChart
                data={activeOrgMonth}
                categories={["value"]}
                index={"time"}
              />
            </div>
            <h1 className="text-3xl font-bold text-center">Active Orgs/week</h1>
            <div className="h-96">
              <BarChart
                data={activeOrgWeek}
                categories={["value"]}
                index={"time"}
              />
            </div>
            <h1 className="text-3xl font-bold text-center">Active Orgs/day</h1>
            <div className="h-96">
              <BarChart
                data={activeOrgDay}
                categories={["value"]}
                index={"time"}
              />
            </div>
            <h1 className="text-3xl font-bold text-center">Total Users</h1>
            <div className="h-96">
              <BarChart
                data={totalUsers}
                categories={["value"]}
                index={"time"}
              />
            </div>
            <h1 className="text-3xl font-bold text-center">
              User Growth Per Month
            </h1>
            <div className="h-96">
              <BarChart
                data={userGrowthPerMonth}
                categories={["value"]}
                index={"time"}
              />
              <h1 className="text-3xl font-bold text-center">
                User Growth Per Week
              </h1>
              <div className="h-96">
                <BarChart
                  data={userGrowthPerWeek}
                  categories={["value"]}
                  index={"time"}
                />
              </div>

              <h1 className="text-3xl font-bold text-center">
                User Growth Per Day
              </h1>
              <div className="h-96">
                <BarChart
                  data={userGrowthPerDay}
                  categories={["value"]}
                  index={"time"}
                />
              </div>

              <h1 className="text-3xl font-bold text-center">
                Requests week over week
              </h1>
              <div className="h-96">
                <BarChart
                  data={weeklyActiveUsers}
                  categories={["value"]}
                  index={"time"}
                />
              </div>
              <h1 className="text-3xl font-bold text-center">
                Requests day by day
              </h1>
              <div className="h-96">
                <BarChart
                  data={dailyActiveUsers}
                  categories={["value"]}
                  index={"time"}
                />
              </div>
              <h1 className="text-3xl font-bold text-center">
                Monthly Retention Rate (1 day of activity)
              </h1>
              <div className="h-96">
                <BarChart
                  data={monthlyRetentionRate}
                  categories={["value"]}
                  index={"time"}
                />
              </div>

              <h1 className="text-3xl font-bold text-center">
                Weekly Retention Rate (Active for more than 1 day)
              </h1>
              <div className="h-96">
                <BarChart
                  data={weeklyRetentionRate}
                  categories={["value"]}
                  index={"time"}
                />
              </div>
            </div>
          </div>
        )}
      </BasePageV2>
    </MetaData>
  );
};

export default Home;

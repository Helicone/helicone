import { useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrg } from "../../layout/org/organizationContext";
import { H1, H3, Muted, Small } from "@/components/ui/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminStatsProps {}

const AdminMetrics = (props: AdminStatsProps) => {
  const {} = props;
  const org = useOrg();
  const timeFilters = [
    "1 days",
    "7 days",
    "1 month",
    "3 months",
    "6 months",
    "12 months",
    "24 months",
  ] as const;
  const groupBys = ["hour", "day", "week", "month"] as const;

  const [timeFilter, setTimeFilter] = useLocalStorage<
    (typeof timeFilters)[number]
  >("admin-metrics-time-filter", "24 months");
  const [groupBy, setGroupBy] = useLocalStorage<(typeof groupBys)[number]>(
    "admin-metrics-group-by",
    "month"
  );

  const metricsOverTime = useQuery({
    queryKey: ["newOrgsOverTime", org?.currentOrg?.id, timeFilter, groupBy],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const timeFilter = query.queryKey[2];
      const groupBy = query.queryKey[3];
      const { data, error } = await jawn.POST(
        `/v1/admin/orgs/over-time/query`,
        {
          method: "POST",
          body: {
            timeFilter: timeFilter as any,
            groupBy: groupBy as any,
          },
        }
      );
      return data;
    },
  });

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center p-4 border border-border rounded-lg bg-card">
        <div className="space-y-1">
          <Small className="font-medium">Time Range:</Small>
          <div className="flex flex-wrap gap-2">
            {timeFilters.map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className="px-2 py-1 h-auto"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Small className="font-medium">Group By:</Small>
          <div className="flex gap-2">
            {groupBys.map((group) => (
              <Button
                key={group}
                variant={groupBy === group ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupBy(group)}
                className="px-3 py-1 h-auto capitalize"
              >
                {group}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="w-full">
          <CardHeader>
            <H3>Organizations Over Time</H3>
            <Muted>Total organization count by {groupBy}</Muted>
          </CardHeader>
          <CardContent className="h-80">
            {metricsOverTime.isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse h-6 w-24 bg-muted rounded"></div>
              </div>
            ) : (
              <BarChart
                data={
                  metricsOverTime.data?.newOrgsOvertime.map((ot) => ({
                    day: ot.day,
                    count: +ot.count,
                  })) ?? []
                }
                categories={["count"]}
                index={"day"}
                showYAxis={true}
                className="h-full"
              />
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <H3>
              New Users by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
            </H3>
            <Muted>User growth over the past {timeFilter}</Muted>
          </CardHeader>
          <CardContent className="h-80">
            {metricsOverTime.isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse h-6 w-24 bg-muted rounded"></div>
              </div>
            ) : (
              <BarChart
                data={
                  metricsOverTime.data?.newUsersOvertime.map((ot) => ({
                    day: ot.day,
                    count: +ot.count,
                  })) ?? []
                }
                categories={["count"]}
                index={"day"}
                showYAxis={true}
                className="h-full"
              />
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <H3>Total Users Over Time</H3>
            <Muted>Cumulative user count</Muted>
          </CardHeader>
          <CardContent className="h-80">
            {metricsOverTime.isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse h-6 w-24 bg-muted rounded"></div>
              </div>
            ) : (
              <BarChart
                data={
                  metricsOverTime.data?.usersOverTime.map((ot) => ({
                    day: ot.day,
                    count: +ot.count,
                  })) ?? []
                }
                categories={["count"]}
                index={"day"}
                showYAxis={true}
                className="h-full"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMetrics;

import { useQuery } from "@tanstack/react-query";
import { BarChart, Select, SelectItem } from "@tremor/react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrg } from "../../layout/org/organizationContext";

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
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Admin Metrics</h1>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-semibold">Time Filter</h2>
          <Select
            value={timeFilter}
            onValueChange={(value) => setTimeFilter(value as any)}
          >
            {timeFilters.map((timeFilter) => (
              <SelectItem value={timeFilter} key={timeFilter}>
                {timeFilter}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-semibold">Group By</h2>
          <Select
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as any)}
          >
            {groupBys.map((groupBy) => (
              <SelectItem value={groupBy} key={groupBy}>
                {groupBy}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <ul className="flex flex-col space-y-8 max-w-6xl">
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-5000 p-4 space-y-4">
          <h2 className="text-xl font-semibold">Orgs Over Time</h2>
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
          />
        </li>
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-5000 p-4 space-y-4">
          <h2 className="text-xl font-semibold">
            New Users/{groupBy} (Since {timeFilter} ago)
          </h2>
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
          />
        </li>
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-5000 p-4 space-y-4">
          <h2 className="text-xl font-semibold">Users Over Time</h2>
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
          />
        </li>
      </ul>
    </div>
  );
};

export default AdminMetrics;

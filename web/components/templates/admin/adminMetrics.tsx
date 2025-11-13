import { useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrg } from "../../layout/org/organizationContext";
import { H1, H2 } from "@/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    "month",
  );

  const metricsOverTime = useQuery({
    queryKey: ["newOrgsOverTime", org?.currentOrg?.id, timeFilter, groupBy],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const timeFilter = query.queryKey[2];
      const groupBy = query.queryKey[3];
      const { data } = await jawn.POST(`/v1/admin/orgs/over-time/query`, {
        method: "POST",
        body: {
          timeFilter: timeFilter as any,
          groupBy: groupBy as any,
        },
      });
      return data;
    },
  });
  return (
    <div className="flex flex-col gap-8 p-4 md:p-6">
      <H1>Admin Metrics</H1>

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <div className="flex flex-1 flex-col gap-2 md:max-w-xs">
          <Label className="font-semibold">Time Filter</Label>
          <Select
            value={timeFilter}
            onValueChange={(value) => setTimeFilter(value as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeFilters.map((timeFilter) => (
                <SelectItem value={timeFilter} key={timeFilter}>
                  {timeFilter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-2 md:max-w-xs">
          <Label className="font-semibold">Group By</Label>
          <Select
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groupBys.map((groupBy) => (
                <SelectItem value={groupBy} key={groupBy}>
                  {groupBy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex max-w-6xl flex-col gap-6">
        <div className="flex h-full w-full flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <H2>Orgs Over Time</H2>
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
        </div>

        <div className="flex h-full w-full flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <H2>
            New Users/{groupBy} (Since {timeFilter} ago)
          </H2>
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
        </div>

        <div className="flex h-full w-full flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <H2>Users Over Time</H2>
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
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;

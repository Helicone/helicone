import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Select,
  SelectItem,
  LineChart,
  MultiSelect,
  MultiSelectItem,
} from "@tremor/react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrg } from "../../layout/organizationContext";
import { useState, useEffect } from "react";

interface AdminStatsProps {}

const AdminMetrics = (props: AdminStatsProps) => {
  const {} = props;
  const org = useOrg();
  const timeFilters = [
    "1 days",
    "7 days",
    "1 month",
    "3 months",
    "12 months",
    "24 months",
  ] as const;
  const groupBys = ["hour", "day", "week", "month"] as const;
  const tiers = ["free", "pro", "growth", "enterprise"] as const;

  const [timeFilter, setTimeFilter] = useLocalStorage<
    (typeof timeFilters)[number]
  >("admin-metrics-time-filter", "24 months");
  const [groupBy, setGroupBy] = useLocalStorage<(typeof groupBys)[number]>(
    "admin-metrics-group-by",
    "month"
  );
  const [selectedTiers, setSelectedTiers] = useLocalStorage<string[]>(
    "admin-metrics-selected-tiers",
    ["growth"]
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

  const [retentionData, setRetentionData] = useState<any[]>([]);

  const retentionQuery = useQuery({
    queryKey: ["retentionData", org?.currentOrg?.id, timeFilter, selectedTiers],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        `/v1/admin/orgs/retention/query`,
        {
          method: "POST",
          body: {
            timeFilter: timeFilter,
            tiers: selectedTiers,
          },
        }
      );
      if (error) throw new Error(error);
      return data;
    },
  });

  useEffect(() => {
    if (retentionQuery.data) {
      setRetentionData(retentionQuery.data);
    }
  }, [retentionQuery.data]);

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
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-5000 p-4 space-y-4 bg-white text-black">
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
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-5000 p-4 space-y-4 bg-white text-black">
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
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-5000 p-4 space-y-4 bg-white text-black">
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
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-5000 p-4 space-y-4 bg-white text-black">
          <h2 className="text-xl font-semibold">Org Retention</h2>
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold">Tiers</h3>
            <MultiSelect
              value={selectedTiers}
              onValueChange={(value: string[]) =>
                setSelectedTiers(value as (typeof tiers)[number][])
              }
            >
              {tiers.map((tier) => (
                <MultiSelectItem value={tier} key={tier}>
                  {tier}
                </MultiSelectItem>
              ))}
            </MultiSelect>
          </div>
          <LineChart
            data={retentionData.map((r) => ({
              month: r.month,
              retention_rate: +r.retention_rate,
            }))}
            index="month"
            categories={["retention_rate"]}
            colors={["blue"]}
            valueFormatter={(number) => `${number ?? 0}%`}
            yAxisWidth={40}
          />
        </li>
      </ul>
    </div>
  );
};

export default AdminMetrics;

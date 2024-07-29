import { useQuery } from "@tanstack/react-query";
import OrgMember from "./panels/orgMember";
import TopOrgs from "./panels/topOrgs";
import { useOrg } from "../../layout/organizationContext";
import { getJawnClient } from "../../../lib/clients/jawn";
import { BarChart } from "@tremor/react";

interface AdminStatsProps {}

const AdminMetrics = (props: AdminStatsProps) => {
  const {} = props;
  const org = useOrg();

  const metricsOverTime = useQuery({
    queryKey: ["newOrgsOverTime", org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const { data, error } = await jawn.POST(
        `/v1/admin/orgs/over-time/query`,
        {
          method: "POST",
        }
      );
      return data;
    },
  });
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Admin Metrics</h1>
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
          <h2 className="text-xl font-semibold">Users Over Time</h2>
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
      </ul>
    </div>
  );
};

export default AdminMetrics;

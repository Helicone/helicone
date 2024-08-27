import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart } from "@tremor/react";

const ColesCave = () => {
  const [identifier, setIdentifier] = useState("");

  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["whodis", identifier],
    queryFn: async () => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/whodis", {
        body: { organizationId: identifier },
      });

      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  console.log("Full data from API:", JSON.stringify(data, null, 2));

  return (
    <div className="flex flex-col space-y-4 text-gray-200 bg-gray-800 p-6 rounded-lg">
      <h1 className="text-2xl font-semibold">Cole's Cave</h1>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter identifier"
          className="flex-grow border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Search
        </button>
      </form>
      {isLoading && <p>Loading...</p>}

      {data?.organization ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Organization Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              { label: "Name", value: data.organization.name },
              { label: "ID", value: data.organization.id },
              {
                label: "Created At",
                value: new Date(data.organization.created_at).toLocaleString(),
              },
              { label: "Owner", value: data.organization.owner },
              { label: "Tier", value: data.organization.tier },
              {
                label: "Stripe Customer ID",
                value: data.organization.stripe_customer_id || "N/A",
              },
              {
                label: "Stripe Subscription ID",
                value: data.organization.stripe_subscription_id || "N/A",
              },
              {
                label: "Subscription Status",
                value: data.organization.subscription_status || "N/A",
              },
            ].map(({ label, value }) => (
              <div key={label} className="mb-2">
                <p className="text-sm text-gray-400">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Usage</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {[
                { label: "Total Requests", value: data.usage?.total_requests },
                {
                  label: "Requests (Last 30 Days)",
                  value: data.usage?.requests_last_30_days,
                },
                { label: "All-Time Count", value: data.usage?.all_time_count },
              ].map(({ label, value }) => (
                <div key={label} className="mb-2">
                  <p className="text-sm text-gray-400">{label}</p>
                  <p className="font-semibold">{value ?? "N/A"}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Monthly Usage</h3>
            <BarChart
              data={data.usage?.monthly_usage ?? []}
              categories={["requestCount"]}
              index="month"
              showYAxis={true}
              className="h-80"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Members</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {data.organization.members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {member.name || "N/A"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {member.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {member.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-red-500">No organization found.</p>
      )}
    </div>
  );
};

export default ColesCave;

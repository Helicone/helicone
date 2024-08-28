import React, { useState } from "react";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { formatLargeNumber } from "@/components/shared/utils/numberFormat";

const ColesCave = () => {
  const [organizationId, setOrganizationId] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [minRequests, setMinRequests] = useState(1_000_000);
  const [limit, setLimit] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [topOrgsParams, setTopOrgsParams] = useState({
    minRequests: 1_000_000,
    limit: 10,
  });

  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["whodis", organizationId, userId, email],
    queryFn: async () => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/whodis", {
        body: { organizationId, userId, email },
      });

      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const {
    data: topOrgsData,
    isLoading: topOrgsLoading,
    refetch: refetchTopOrgs,
  } = useQuery({
    queryKey: ["topOrgs", topOrgsParams.minRequests, topOrgsParams.limit],
    queryFn: async () => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/orgs/top-usage", {
        body: {
          limit: 1000, // Set a high limit to fetch all organizations
          minRequests: topOrgsParams.minRequests,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setIsSearching(true);
    refetch().finally(() => setIsSearching(false));
  };

  const handleTopOrgsUpdate = () => {
    setTopOrgsParams({ minRequests, limit });
    refetchTopOrgs();
  };

  console.log("Full data from API:", JSON.stringify(data, null, 2));

  const sortAndFormatMonthlyUsage = (monthlyUsage: any[]) => {
    return monthlyUsage
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .map((item) => ({
        ...item,
        month: new Date(item.month).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        }),
        requestCount: item.requestCount,
      }));
  };

  const getOwnerFromMembers = (
    members: {
      id: string;
      email: string;
      name: string;
      role: string;
      last_sign_in_at: string | null;
    }[]
  ): { name: string; email: string } => {
    return (
      members.find((member) => member.role.toLowerCase() === "owner") || {
        name: "N/A",
        email: "N/A",
      }
    );
  };

  return (
    <div className="flex flex-col space-y-4 text-gray-200 bg-gray-800 p-6 rounded-lg">
      <h1 className="text-2xl font-semibold">Cole&apos;s Cave</h1>

      {/* Top Organizations Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">
          Top Organizations by Usage
        </h2>
        <div className="flex space-x-4 mb-4">
          <div>
            <label
              htmlFor="minRequests"
              className="block text-sm font-medium text-gray-400"
            >
              Min Requests
            </label>
            <input
              type="number"
              id="minRequests"
              value={minRequests}
              onChange={(e) => setMinRequests(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="limit"
              className="block text-sm font-medium text-gray-400"
            >
              Limit
            </label>
            <input
              type="number"
              id="limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-gray-900"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleTopOrgsUpdate}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Update
            </button>
          </div>
        </div>
        {topOrgsLoading ? (
          <p>Loading top organizations...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/4 max-w-xs">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Requests
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last 30 Days
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {topOrgsData?.organizations.map((org) => {
                  const owner = getOwnerFromMembers(org.organization.members);
                  return [
                    <tr key={`${org.organization.id}-main`}>
                      <td className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                        {org.organization.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {owner.name} ({owner.email})
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatLargeNumber(org.usage.total_requests)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatLargeNumber(org.usage.requests_last_30_days)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() =>
                            setExpandedOrg(
                              expandedOrg === org.organization.id
                                ? null
                                : org.organization.id
                            )
                          }
                          className="text-blue-500 hover:text-blue-400"
                        >
                          {expandedOrg === org.organization.id
                            ? "Hide"
                            : "Show"}
                        </button>
                      </td>
                    </tr>,
                    expandedOrg === org.organization.id && (
                      <tr key={`${org.organization.id}-expanded`}>
                        <td colSpan={5}>
                          <div className="p-4 bg-gray-700 rounded-lg mt-2 mb-2">
                            <div className="grid grid-cols-2 gap-4">
                              <p>ID: {org.organization.id}</p>
                              <p>
                                Created:{" "}
                                {new Date(
                                  org.organization.created_at
                                ).toLocaleString()}
                              </p>
                              <p>Tier: {org.organization.tier}</p>
                              <p>
                                Subscription:{" "}
                                {org.organization.subscription_status || "N/A"}
                              </p>
                              <p>
                                All-Time Count:{" "}
                                {formatLargeNumber(org.usage.all_time_count)}
                              </p>
                            </div>
                            <h4 className="text-lg font-semibold mt-4 mb-2">
                              Monthly Usage
                            </h4>
                            <BarChart
                              data={sortAndFormatMonthlyUsage(
                                org.usage.monthly_usage
                              )}
                              categories={["requestCount"]}
                              index="month"
                              showYAxis={true}
                              className="h-60"
                            />
                            <h4 className="text-lg font-semibold mt-4 mb-2">
                              Organization Members
                            </h4>
                            <table className="min-w-full divide-y divide-gray-600">
                              <thead className="bg-gray-800">
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
                              <tbody className="bg-gray-700 divide-y divide-gray-600">
                                {org.organization.members.map((member) => (
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
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-semibold mt-8">Organization Details</h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div>
          <label
            htmlFor="organizationId"
            className="block text-sm font-medium text-gray-400"
          >
            Organization ID
          </label>
          <input
            type="text"
            id="organizationId"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-gray-900"
          />
        </div>
        <div>
          <label
            htmlFor="userId"
            className="block text-sm font-medium text-gray-400"
          >
            User ID
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-gray-900"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-400"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-gray-900"
          />
        </div>
        <div className="md:col-span-3">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>
      {isSearching && <p>Searching...</p>}

      {data?.organizations && data.organizations.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/4 max-w-xs">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Requests
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last 30 Days
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {data.organizations.map((org) => {
                  const owner = getOwnerFromMembers(org.organization.members);
                  return [
                    <tr key={`${org.organization.id}-main`}>
                      <td className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                        {org.organization.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {owner.name} ({owner.email})
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatLargeNumber(org.usage.total_requests)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatLargeNumber(org.usage.requests_last_30_days)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() =>
                            setExpandedOrg(
                              expandedOrg === org.organization.id
                                ? null
                                : org.organization.id
                            )
                          }
                          className="text-blue-500 hover:text-blue-400"
                        >
                          {expandedOrg === org.organization.id
                            ? "Hide"
                            : "Show"}
                        </button>
                      </td>
                    </tr>,
                    expandedOrg === org.organization.id && (
                      <tr key={`${org.organization.id}-expanded`}>
                        <td colSpan={5}>
                          <div className="p-4 bg-gray-700 rounded-lg mt-2 mb-2">
                            <div className="grid grid-cols-2 gap-4">
                              <p>ID: {org.organization.id}</p>
                              <p>
                                Created:{" "}
                                {new Date(
                                  org.organization.created_at
                                ).toLocaleString()}
                              </p>
                              <p>Tier: {org.organization.tier}</p>
                              <p>
                                Subscription:{" "}
                                {org.organization.subscription_status || "N/A"}
                              </p>
                              <p>
                                All-Time Count:{" "}
                                {formatLargeNumber(org.usage.all_time_count)}
                              </p>
                            </div>
                            <h4 className="text-lg font-semibold mt-4 mb-2">
                              Monthly Usage
                            </h4>
                            <BarChart
                              data={sortAndFormatMonthlyUsage(
                                org.usage.monthly_usage
                              )}
                              categories={["requestCount"]}
                              index="month"
                              showYAxis={true}
                              className="h-60"
                            />
                            <h4 className="text-lg font-semibold mt-4 mb-2">
                              Organization Members
                            </h4>
                            <table className="min-w-full divide-y divide-gray-600">
                              <thead className="bg-gray-800">
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
                              <tbody className="bg-gray-700 divide-y divide-gray-600">
                                {org.organization.members.map((member) => (
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
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        hasSearched &&
        !isSearching && <p className="text-red-500">No organization found.</p>
      )}
    </div>
  );
};

export default ColesCave;

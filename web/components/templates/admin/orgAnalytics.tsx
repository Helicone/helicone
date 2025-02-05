import React, { useState } from "react";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { SearchIcon } from "lucide-react";
import { PiSpinnerGapBold } from "react-icons/pi";

const OrgAnalytics = () => {
  const [organizationId, setOrganizationId] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [minRequests, setMinRequests] = useState(1_000_000);
  const [limit, setLimit] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasAttemptedTopOrgsFetch, setHasAttemptedTopOrgsFetch] =
    useState(false);

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
    queryKey: ["topOrgs", minRequests, limit],
    queryFn: async () => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/orgs/top-usage", {
        body: {
          limit,
          minRequests,
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
    setHasAttemptedTopOrgsFetch(true);
    refetchTopOrgs();
  };

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
    <div className="flex flex-col space-y-8 text-gray-200 bg-gray-800 p-6 rounded-lg max-w-7xl mx-auto">
      <header className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold">Cole's Cave</h1>
        <p className="text-gray-400 mt-2">
          Organization analytics and administration
        </p>
      </header>

      {/* Top Organizations Section */}
      <section className="bg-gray-900 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Top Organizations by Usage</h2>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Min Requests:</label>
              <input
                type="number"
                value={minRequests}
                onChange={(e) => setMinRequests(Number(e.target.value))}
                className="w-32 px-3 py-1.5 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Limit:</label>
              <input
                type="number"
                value={limit}
                min={1}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleTopOrgsUpdate}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors duration-200"
            >
              Refresh List
            </button>
          </div>
        </div>

        {!hasAttemptedTopOrgsFetch ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-300">
              No data loaded
            </h3>
            <p className="text-gray-500 mt-2">
              Click "Refresh List" to load organizations
            </p>
          </div>
        ) : topOrgsLoading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  {[
                    "Name",
                    "Owner",
                    "Total Requests",
                    "Last 30 Days",
                    "Details",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topOrgsData?.organizations.map((org) => {
                  const owner = getOwnerFromMembers(org.organization.members);
                  return (
                    <React.Fragment key={org.organization.id}>
                      <tr className="hover:bg-gray-850 transition-colors border-b border-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                          {org.organization.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {owner.name} ({owner.email})
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatLargeNumber(org.usage.total_requests)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatLargeNumber(org.usage.requests_last_30_days)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setExpandedOrg(
                                expandedOrg === org.organization.id
                                  ? null
                                  : org.organization.id
                              )
                            }
                            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                          >
                            {expandedOrg === org.organization.id ? (
                              <>
                                <span>Collapse</span>
                                <ChevronUpIcon className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span>Expand</span>
                                <ChevronDownIcon className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedOrg === org.organization.id && (
                        <tr>
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
                                  {org.organization.subscription_status ||
                                    "N/A"}
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
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Search Section */}
      <section className="bg-gray-900 p-6 rounded-xl shadow-lg">
        <div className="border-b border-gray-700 pb-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-100">
            Organization Lookup
          </h2>
          <p className="text-gray-400 mt-1">
            Search by organization ID, user ID, or email address
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Organization ID
            </label>
            <input
              type="text"
              id="organizationId"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-500"
              placeholder="Enter organization ID"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-500"
              placeholder="Enter user ID"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-500"
              placeholder="Enter email address"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <PiSpinnerGapBold className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <SearchIcon className="w-5 h-5" />
                  Search Organizations
                </>
              )}
            </button>
          </div>
        </form>

        {(error as Error) && (
          <div className="mb-4 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-200">
            <h3 className="font-medium">Search Error</h3>
            <p className="mt-1 text-sm">
              {(error instanceof Error ? error.message : String(error)) ||
                "Failed to fetch organization data"}
            </p>
          </div>
        )}

        {!hasSearched ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-300">
              Enter search criteria
            </h3>
            <p className="text-gray-500 mt-2">
              Use the form above to search for organizations
            </p>
          </div>
        ) : isSearching ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-lg" />
            ))}
          </div>
        ) : !data?.organizations?.length ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">
            <div className="text-6xl mb-4">🕵️</div>
            <h3 className="text-lg font-medium text-gray-300">
              No organizations found
            </h3>
            <p className="text-gray-500 mt-2">Try different search criteria</p>
          </div>
        ) : (
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
                                  {org.organization.subscription_status ||
                                    "N/A"}
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
        )}
      </section>
    </div>
  );
};

export default OrgAnalytics;

import React, { useState } from "react";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { SearchIcon } from "lucide-react";
import { PiSpinnerGapBold } from "react-icons/pi";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";

const OrgAnalytics = () => {
  const { user } = useHeliconeAuthClient();
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
    }[],
  ): { name: string; email: string } => {
    return (
      members.find((member) => member?.role?.toLowerCase() === "owner") || {
        name: "N/A",
        email: "N/A",
      }
    );
  };
  const { setNotification } = useNotification();

  const { mutate: addAdminToOrg } = useMutation({
    mutationKey: ["addAdminToOrg"],
    mutationFn: async ({
      orgId,
      adminIds,
    }: {
      orgId: string;
      adminIds: string[];
    }) => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/admins/org/query", {
        body: {
          orgId,
          adminIds,
        },
      });
      if (error) {
        setNotification("Failed to add admins to org", "error");
      } else {
        setNotification("Admins added to org", "success");
      }
    },
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-8 rounded-lg bg-gray-800 p-6 text-gray-200">
      <header className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold">Org Analytics</h1>
        <p className="mt-2 text-gray-400">
          Organization analytics and administration
        </p>
      </header>

      {/* Top Organizations Section */}
      <section className="rounded-xl bg-gray-900 p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top Organizations by Usage</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Min Requests:</label>
              <input
                type="number"
                value={minRequests}
                onChange={(e) => setMinRequests(Number(e.target.value))}
                className="w-32 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Limit:</label>
              <input
                type="number"
                value={limit}
                min={1}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-24 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleTopOrgsUpdate}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium transition-colors duration-200 hover:bg-blue-700"
            >
              Refresh List
            </button>
          </div>
        </div>

        {!hasAttemptedTopOrgsFetch ? (
          <div className="rounded-lg border-2 border-dashed border-gray-800 py-8 text-center">
            <div className="mb-4 text-6xl">📊</div>
            <h3 className="text-lg font-medium text-gray-300">
              No data loaded
            </h3>
            <p className="mt-2 text-gray-500">
              Click &quot;Refresh List&quot; to load organizations
            </p>
          </div>
        ) : topOrgsLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-700">
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
                      className="border-b border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-300"
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
                      <tr className="hover:bg-gray-850 border-b border-gray-800 transition-colors">
                        <td className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3">
                          {org.organization.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {owner.name} ({owner.email})
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatLargeNumber(org.usage.total_requests)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatLargeNumber(org.usage.requests_last_30_days)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setExpandedOrg(
                                expandedOrg === org.organization.id
                                  ? null
                                  : org.organization.id,
                              )
                            }
                            className="flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300"
                          >
                            {expandedOrg === org.organization.id ? (
                              <>
                                <span>Collapse</span>
                                <ChevronUpIcon className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <span>Expand</span>
                                <ChevronDownIcon className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedOrg === org.organization.id && (
                        <tr>
                          <td colSpan={5}>
                            <div className="mb-2 mt-2 rounded-lg bg-gray-700 p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <p>ID: {org.organization.id}</p>
                                <p>
                                  Created:{" "}
                                  {new Date(
                                    org.organization.created_at,
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
                              <h4 className="mb-2 mt-4 text-lg font-semibold">
                                Monthly Usage
                              </h4>
                              <BarChart
                                data={sortAndFormatMonthlyUsage(
                                  org.usage.monthly_usage,
                                )}
                                categories={["requestCount"]}
                                index="month"
                                showYAxis={true}
                                className="h-60"
                              />
                              <h4 className="mb-2 mt-4 text-lg font-semibold">
                                Organization Members
                              </h4>
                              <table className="min-w-full divide-y divide-gray-600">
                                <thead className="bg-gray-800">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                                      Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                                      Email
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                                      Role
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-600 bg-gray-700">
                                  {org.organization.members.map((member) => (
                                    <tr key={member.id}>
                                      <td className="whitespace-nowrap px-4 py-2">
                                        {member.name || "N/A"}
                                      </td>
                                      <td className="whitespace-nowrap px-4 py-2">
                                        {member.email}
                                      </td>
                                      <td className="whitespace-nowrap px-4 py-2">
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
      <section className="rounded-xl bg-gray-900 p-6 shadow-lg">
        <div className="mb-6 border-b border-gray-700 pb-4">
          <h2 className="text-xl font-semibold text-gray-100">
            Organization Lookup
          </h2>
          <p className="mt-1 text-gray-400">
            Search by organization ID, user ID, or email address
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3"
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
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <PiSpinnerGapBold className="h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <SearchIcon className="h-5 w-5" />
                  Search Organizations
                </>
              )}
            </button>
          </div>
        </form>

        {(error as Error) && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-4 text-red-200">
            <h3 className="font-medium">Search Error</h3>
            <p className="mt-1 text-sm">
              {(error instanceof Error ? error.message : String(error)) ||
                "Failed to fetch organization data"}
            </p>
          </div>
        )}

        {!hasSearched ? (
          <div className="rounded-lg border-2 border-dashed border-gray-800 py-8 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="text-lg font-medium text-gray-300">
              Enter search criteria
            </h3>
            <p className="mt-2 text-gray-500">
              Use the form above to search for organizations
            </p>
          </div>
        ) : isSearching ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-800" />
            ))}
          </div>
        ) : !data?.organizations?.length ? (
          <div className="rounded-lg border-2 border-dashed border-gray-800 py-8 text-center">
            <div className="mb-4 text-6xl">🕵️</div>
            <h3 className="text-lg font-medium text-gray-300">
              No organizations found
            </h3>
            <p className="mt-2 text-gray-500">Try different search criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="w-1/4 max-w-xs px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Owner
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Total Requests
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Last 30 Days
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-800">
                  {data.organizations.map((org) => {
                    const owner = getOwnerFromMembers(org.organization.members);
                    return [
                      <tr key={`${org.organization.id}-main`}>
                        <td className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-4 py-2">
                          {org.organization.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {owner.name} ({owner.email})
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {formatLargeNumber(org.usage.total_requests)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {formatLargeNumber(org.usage.requests_last_30_days)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          <button
                            onClick={() =>
                              setExpandedOrg(
                                expandedOrg === org.organization.id
                                  ? null
                                  : org.organization.id,
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
                            <div className="mb-2 mt-2 rounded-lg bg-gray-700 p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <p>ID: {org.organization.id}</p>
                                <p>
                                  <Button
                                    size="sm_sleek"
                                    onClick={() =>
                                      addAdminToOrg({
                                        orgId: org.organization.id,
                                        adminIds: [user?.id || ""],
                                      })
                                    }
                                  >
                                    Add Me ({user?.email})
                                  </Button>
                                </p>
                                <p>
                                  Created:{" "}
                                  {new Date(
                                    org.organization.created_at,
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
                              <h4 className="mb-2 mt-4 text-lg font-semibold">
                                Monthly Usage
                              </h4>
                              <BarChart
                                data={sortAndFormatMonthlyUsage(
                                  org.usage.monthly_usage,
                                )}
                                categories={["requestCount"]}
                                index="month"
                                showYAxis={true}
                                className="h-60"
                              />
                              <h4 className="mb-2 mt-4 text-lg font-semibold">
                                Organization Members
                              </h4>
                              <table className="min-w-full divide-y divide-gray-600">
                                <thead className="bg-gray-800">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                                      Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                                      Email
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                                      Role
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-600 bg-gray-700">
                                  {org.organization.members.map((member) => (
                                    <tr key={member.id}>
                                      <td className="whitespace-nowrap px-4 py-2">
                                        {member.name || "N/A"}
                                      </td>
                                      <td className="whitespace-nowrap px-4 py-2">
                                        {member.email}
                                      </td>
                                      <td className="whitespace-nowrap px-4 py-2">
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

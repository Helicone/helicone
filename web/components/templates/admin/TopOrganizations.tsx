import React, { useState } from "react";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import { ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import {
  getOwnerFromMembers,
  sortAndFormatMonthlyUsage,
} from "./utils/organizationUtils";
import { H2, H4, P, Small, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TopOrganizations = () => {
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [inputMinRequests, setInputMinRequests] = useState(1_000_000);
  const [inputLimit, setInputLimit] = useState(10);
  const [queryParams, setQueryParams] = useState({
    minRequests: 1_000_000,
    limit: 10,
  });
  const [hasAttemptedTopOrgsFetch, setHasAttemptedTopOrgsFetch] =
    useState(false);

  const {
    data: topOrgsData,
    isLoading: topOrgsLoading,
    refetch: refetchTopOrgs,
  } = useQuery({
    queryKey: ["topOrgs", queryParams.minRequests, queryParams.limit],
    queryFn: async () => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/orgs/top-usage", {
        body: {
          limit: queryParams.limit,
          minRequests: queryParams.minRequests,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const handleTopOrgsUpdate = () => {
    setHasAttemptedTopOrgsFetch(true);
    setQueryParams({
      minRequests: inputMinRequests,
      limit: inputLimit,
    });
    setTimeout(() => {
      refetchTopOrgs();
    }, 0);
  };

  const toggleExpandOrg = (orgId: string) => {
    setExpandedOrg(expandedOrg === orgId ? null : orgId);
  };

  return (
    <section className="bg-card rounded-lg border border-border p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <H2>Top Organizations by Usage</H2>

        <div className="flex flex-wrap gap-3 items-center border border-border rounded-lg px-3 py-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <Small className="whitespace-nowrap">Min Requests:</Small>
            <Input
              type="number"
              value={inputMinRequests}
              onChange={(e) => setInputMinRequests(Number(e.target.value))}
              className="w-28 h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Small className="whitespace-nowrap">Limit:</Small>
            <Input
              type="number"
              value={inputLimit}
              min={1}
              onChange={(e) => setInputLimit(Number(e.target.value))}
              className="w-20 h-8"
            />
          </div>

          <Button size="sm" className="ml-1" onClick={handleTopOrgsUpdate}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {!hasAttemptedTopOrgsFetch ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted/20">
          <div className="text-6xl mb-4">📊</div>
          <H4>No data loaded</H4>
          <Muted className="mt-2">
            Click &quot;Refresh&quot; to load organizations
          </Muted>
        </div>
      ) : topOrgsLoading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg">
          <div className="max-h-[800px] overflow-auto">
            <table className="w-full table-fixed">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border w-[35%] bg-card">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border w-[35%] bg-card">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border w-[15%] bg-card">
                    Total Requests
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border w-[15%] bg-card">
                    Last 30 Days
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topOrgsData?.organizations.map((org) => {
                  const owner = getOwnerFromMembers(org.organization.members);
                  const isExpanded = expandedOrg === org.organization.id;
                  return (
                    <React.Fragment key={org.organization.id}>
                      <tr
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => toggleExpandOrg(org.organization.id)}
                      >
                        <td className="px-4 py-3 text-ellipsis overflow-hidden">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1 rounded-full hover:bg-muted flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandOrg(org.organization.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                            <span className="font-medium">
                              {org.organization.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm overflow-hidden text-ellipsis">
                          {owner.name}
                          <span className="text-muted-foreground ml-1">
                            ({owner.email})
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatLargeNumber(org.usage.total_requests)}
                        </td>
                        <td className="px-4 py-3">
                          {formatLargeNumber(org.usage.requests_last_30_days)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-muted/10">
                          <td colSpan={4}>
                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                                <div className="space-y-2 rounded-lg border border-border p-3">
                                  <Small className="font-medium text-muted-foreground">
                                    Organization Details
                                  </Small>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Small className="text-muted-foreground">
                                        ID
                                      </Small>
                                      <P className="font-mono text-xs truncate">
                                        {org.organization.id}
                                      </P>
                                    </div>
                                    <div>
                                      <Small className="text-muted-foreground">
                                        Created
                                      </Small>
                                      <P>
                                        {new Date(
                                          org.organization.created_at
                                        ).toLocaleDateString()}
                                      </P>
                                    </div>
                                    <div>
                                      <Small className="text-muted-foreground">
                                        Tier
                                      </Small>
                                      <P>{org.organization.tier}</P>
                                    </div>
                                    <div>
                                      <Small className="text-muted-foreground">
                                        Subscription
                                      </Small>
                                      <P>
                                        {org.organization.subscription_status ||
                                          "N/A"}
                                      </P>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2 rounded-lg border border-border p-3">
                                  <Small className="font-medium text-muted-foreground">
                                    Usage Statistics
                                  </Small>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Small className="text-muted-foreground">
                                        Total Requests
                                      </Small>
                                      <P className="font-medium">
                                        {formatLargeNumber(
                                          org.usage.total_requests
                                        )}
                                      </P>
                                    </div>
                                    <div>
                                      <Small className="text-muted-foreground">
                                        Last 30 Days
                                      </Small>
                                      <P className="font-medium">
                                        {formatLargeNumber(
                                          org.usage.requests_last_30_days
                                        )}
                                      </P>
                                    </div>
                                    <div>
                                      <Small className="text-muted-foreground">
                                        All-Time Count
                                      </Small>
                                      <P className="font-medium">
                                        {formatLargeNumber(
                                          org.usage.all_time_count
                                        )}
                                      </P>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-lg border border-border p-3 mb-4">
                                <Small className="font-medium text-muted-foreground mb-2 block">
                                  Monthly Usage
                                </Small>
                                <div className="h-60">
                                  <BarChart
                                    data={sortAndFormatMonthlyUsage(
                                      org.usage.monthly_usage
                                    )}
                                    categories={["requestCount"]}
                                    index="month"
                                    showYAxis={true}
                                    className="h-full"
                                  />
                                </div>
                              </div>

                              <div className="rounded-lg border border-border p-3">
                                <Small className="font-medium text-muted-foreground mb-2 block">
                                  Organization Members
                                </Small>
                                <div className="max-h-[200px] overflow-auto rounded-md border border-border">
                                  <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3 bg-card">
                                          Name
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3 bg-card">
                                          Email
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3 bg-card">
                                          Role
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {org.organization.members.map(
                                        (member) => (
                                          <tr
                                            key={member.id}
                                            className="hover:bg-muted/20"
                                          >
                                            <td className="px-4 py-2">
                                              {member.name || "N/A"}
                                            </td>
                                            <td className="px-4 py-2 overflow-hidden text-ellipsis">
                                              {member.email}
                                            </td>
                                            <td className="px-4 py-2">
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted">
                                                {member.role}
                                              </span>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
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
        </div>
      )}
    </section>
  );
};

export default TopOrganizations;

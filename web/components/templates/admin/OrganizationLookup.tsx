import React, { useState } from "react";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import { Search } from "lucide-react";
import { PiSpinnerGapBold } from "react-icons/pi";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { useUser } from "@supabase/auth-helpers-react";
import {
  getOwnerFromMembers,
  sortAndFormatMonthlyUsage,
} from "./utils/organizationUtils";
import { H2, H3, H4, P, Small, Muted } from "@/components/ui/typography";

const OrganizationLookup = () => {
  const user = useUser();
  const [organizationId, setOrganizationId] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setIsSearching(true);
    refetch().finally(() => setIsSearching(false));
  };

  const { setNotification } = useNotification();

  const { mutate: addAdminToOrg, isLoading: isAddingAdminToOrg } = useMutation({
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
    <section className="bg-card rounded-lg border border-border p-6">
      <div className="border-b border-border pb-4 mb-6">
        <H2>Organization Lookup</H2>
        <Muted>Search by organization ID, user ID, or email address</Muted>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <div className="flex flex-col gap-2">
          <Small className="font-medium">Organization ID</Small>
          <input
            type="text"
            id="organizationId"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-input focus:ring-2 focus:ring-ring text-foreground placeholder-muted-foreground"
            placeholder="Enter organization ID"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Small className="font-medium">User ID</Small>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-input focus:ring-2 focus:ring-ring text-foreground placeholder-muted-foreground"
            placeholder="Enter user ID"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Small className="font-medium">Email</Small>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-input focus:ring-2 focus:ring-ring text-foreground placeholder-muted-foreground"
            placeholder="Enter email address"
          />
        </div>
        <div className="md:col-span-3">
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <PiSpinnerGapBold className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={20} />
                Search Organizations
              </>
            )}
          </Button>
        </div>
      </form>

      {(error as Error) && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/30 border border-destructive text-destructive-foreground">
          <H3>Search Error</H3>
          <P className="mt-1 text-sm">
            {(error instanceof Error ? error.message : String(error)) ||
              "Failed to fetch organization data"}
          </P>
        </div>
      )}

      {!hasSearched ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <H4>Enter search criteria</H4>
          <Muted className="mt-2">
            Use the form above to search for organizations
          </Muted>
        </div>
      ) : isSearching ? (
        <div className="flex flex-col gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      ) : !data?.organizations?.length ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <div className="text-6xl mb-4">🕵️</div>
          <H4>No organizations found</H4>
          <Muted className="mt-2">Try different search criteria</Muted>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/4 max-w-xs">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Requests
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last 30 Days
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedOrg(
                              expandedOrg === org.organization.id
                                ? null
                                : org.organization.id
                            )
                          }
                        >
                          {expandedOrg === org.organization.id
                            ? "Hide"
                            : "Show"}
                        </Button>
                      </td>
                    </tr>,
                    expandedOrg === org.organization.id && (
                      <tr key={`${org.organization.id}-expanded`}>
                        <td colSpan={5}>
                          <div className="p-4 bg-muted rounded-lg mt-2 mb-2">
                            <div className="grid grid-cols-2 gap-4">
                              <P>ID: {org.organization.id}</P>
                              <P>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    addAdminToOrg({
                                      orgId: org.organization.id,
                                      adminIds: [user?.id || ""],
                                    })
                                  }
                                >
                                  Add Me ({user?.email})
                                </Button>
                              </P>
                              <P>
                                Created:{" "}
                                {new Date(
                                  org.organization.created_at
                                ).toLocaleString()}
                              </P>
                              <P>Tier: {org.organization.tier}</P>
                              <P>
                                Subscription:{" "}
                                {org.organization.subscription_status || "N/A"}
                              </P>
                              <P>
                                All-Time Count:{" "}
                                {formatLargeNumber(org.usage.all_time_count)}
                              </P>
                            </div>
                            <H4 className="mt-4 mb-2">Monthly Usage</H4>
                            <BarChart
                              data={sortAndFormatMonthlyUsage(
                                org.usage.monthly_usage
                              )}
                              categories={["requestCount"]}
                              index="month"
                              showYAxis={true}
                              className="h-60"
                            />
                            <H4 className="mt-4 mb-2">Organization Members</H4>
                            <table className="min-w-full divide-y divide-border">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Email
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Role
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-background divide-y divide-border">
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
  );
};

export default OrganizationLookup;

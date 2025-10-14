import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { getJawnClient } from "@/lib/clients/jawn";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Search, Loader2, Trash2, UserPlus } from "lucide-react";
import { H1, P, H3, Small, Muted } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useNotification from "@/components/shared/notification/useNotification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const OrgSearch = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const limit = 50;

  // Initialize search query from URL parameter
  useEffect(() => {
    if (router.query.q && typeof router.query.q === "string") {
      setSearchQuery(router.query.q);
    }
  }, [router.query.q]);

  // Debounce search query by 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Infinite scroll with useInfiniteQuery
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["orgSearchFast", debouncedSearchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/org-search-fast", {
        body: { query: debouncedSearchQuery, limit, offset: pageParam },
      });

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.hasMore) return undefined;
      return allPages.length * limit;
    },
    enabled: debouncedSearchQuery.trim().length > 0,
  });

  // Flatten all organizations from all pages
  const allOrganizations = data?.pages.flatMap((page) => page.organizations) ?? [];

  // Auto-expand first org when loaded from URL parameter
  // Only auto-expand if:
  // 1. We have exactly 1 result (likely an org ID search)
  // 2. OR the query looks like a UUID (organization ID)
  const hasAutoExpanded = useRef(false);
  useEffect(() => {
    if (
      router.query.q &&
      allOrganizations.length > 0 &&
      !hasAutoExpanded.current
    ) {
      const query = router.query.q.toString();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

      // Auto-expand if it's a UUID search or if there's only 1 result
      if (isUUID || allOrganizations.length === 1) {
        setExpandedOrg(allOrganizations[0].id);
        hasAutoExpanded.current = true;
      }
    }
  }, [router.query.q, allOrganizations]);

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Lazy load usage data for a specific org (for expanded view)
  const useOrgUsage = (orgId: string | null) => {
    return useQuery({
      queryKey: ["orgUsage", orgId],
      queryFn: async () => {
        if (!orgId) return null;
        const jawn = getJawnClient();
        const { data, error } = await jawn.GET("/v1/admin/org-usage/{orgId}", {
          params: { path: { orgId } },
        });

        if (error) throw error;
        return data;
      },
      enabled: !!orgId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
  };

  // Lightweight usage stats for table rows (async, non-blocking)
  const useOrgUsageLight = (orgId: string) => {
    return useQuery({
      queryKey: ["orgUsageLight", orgId],
      queryFn: async () => {
        const jawn = getJawnClient();
        const { data, error } = await jawn.GET("/v1/admin/org-usage-light/{orgId}", {
          params: { path: { orgId } },
        });

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
  };

  const handleExpand = (orgId: string) => {
    setExpandedOrg(expandedOrg === orgId ? null : orgId);
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
      members.find((member) => member?.role?.toLowerCase() === "owner") || {
        name: "N/A",
        email: "N/A",
      }
    );
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "enterprise":
        return "default";
      case "pro":
      case "growth":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6 overflow-hidden">
      <header className="flex flex-col gap-2 flex-shrink-0">
        <H1>Organization Search</H1>
        <Muted>
          Search by organization name, email, domain, or ID
        </Muted>
      </header>

      <div className="flex w-full max-w-2xl gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Try: acme.com, user@email.com, org name, or org ID..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="flex flex-col gap-2 p-6">
                  <div className="h-6 w-48 rounded bg-muted" />
                  <div className="h-4 w-64 rounded bg-muted" />
                  <div className="h-4 w-32 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State - Before Search */}
        {!debouncedSearchQuery && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="text-6xl">🔍</div>
              <H3>Enter search criteria</H3>
              <Muted>Use the search box above to find organizations</Muted>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No Results */}
        {debouncedSearchQuery &&
          !isLoading &&
          allOrganizations.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="text-6xl">🕵️</div>
                <H3>No organizations found</H3>
                <Muted>Try different search criteria</Muted>
              </CardContent>
            </Card>
          )}

        {/* Results Table */}
        {!isLoading && allOrganizations.length > 0 && (
          <>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Organization
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Owner Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Members
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Last Request
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Requests (30d)
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allOrganizations.map((org) => {
                    const owner = getOwnerFromMembers(org.members);
                    const isExpanded = expandedOrg === org.id;

                    return (
                      <OrgTableRow
                        key={org.id}
                        org={org}
                        owner={owner}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleExpand(org.id)}
                        useOrgUsage={useOrgUsage}
                        useOrgUsageLight={useOrgUsageLight}
                        getTierBadgeVariant={getTierBadgeVariant}
                        sortAndFormatMonthlyUsage={sortAndFormatMonthlyUsage}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="py-4 text-center">
              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <Muted>Loading more organizations...</Muted>
                </div>
              )}
              {!hasNextPage && allOrganizations.length > 0 && (
                <Muted>No more results</Muted>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Add Admin Dialog Component
const AddAdminDialog = ({ orgId, orgName }: { orgId: string; orgName: string }) => {
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);

  // Fetch all admins
  const { data: adminsData, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const jawn = getJawnClient();
      return jawn.GET("/v1/admin/admins/query");
    },
    refetchOnWindowFocus: false,
  });

  // Add admin to org mutation
  const addAdminToOrgMutation = useMutation({
    mutationFn: async (adminIds: string[]) => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/admins/org/query", {
        body: {
          orgId,
          adminIds,
        },
      });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgSearchFast"] });
      setNotification("Admins added to organization successfully", "success");
      setOpen(false);
      setSelectedAdminIds([]);
    },
    onError: (error: any) => {
      setNotification(error.message || "Failed to add admins to organization", "error");
    },
  });

  const handleToggleAdmin = (adminId: string) => {
    setSelectedAdminIds((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId]
    );
  };

  const handleAddAdmins = () => {
    if (selectedAdminIds.length === 0) {
      setNotification("Please select at least one admin", "error");
      return;
    }
    addAdminToOrgMutation.mutate(selectedAdminIds);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus size={16} className="mr-2" />
          Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Admin to Organization</DialogTitle>
          <DialogDescription>
            Add admin users to {orgName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <Muted>Loading admins...</Muted>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                <Small className="font-medium">Select Admins</Small>
                {adminsData?.data?.map((admin) => (
                  <label
                    key={admin.user_id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAdminIds.includes(admin.user_id ?? "")}
                      onChange={() => handleToggleAdmin(admin.user_id ?? "")}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{admin.user_email}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={addAdminToOrgMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddAdmins}
                  disabled={addAdminToOrgMutation.isPending || selectedAdminIds.length === 0}
                >
                  {addAdminToOrgMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    `Add ${selectedAdminIds.length > 0 ? `(${selectedAdminIds.length})` : ""}`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Table row component with expandable details
const OrgTableRow = ({
  org,
  owner,
  isExpanded,
  onToggleExpand,
  useOrgUsage,
  useOrgUsageLight,
  getTierBadgeVariant,
  sortAndFormatMonthlyUsage,
}: {
  org: any;
  owner: { name: string; email: string };
  isExpanded: boolean;
  onToggleExpand: () => void;
  useOrgUsage: (orgId: string | null) => any;
  useOrgUsageLight: (orgId: string) => any;
  getTierBadgeVariant: (tier: string) => any;
  sortAndFormatMonthlyUsage: (monthlyUsage: any[]) => any[];
}) => {
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();

  // Fetch lightweight usage stats immediately (non-blocking)
  const {
    data: lightUsageData,
    isLoading: lightUsageLoading,
  } = useOrgUsageLight(org.id);

  // Only fetch full usage data when expanded
  const {
    data: usageData,
    isLoading: usageLoading,
  } = useOrgUsage(isExpanded ? org.id : null);

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const jawn = getJawnClient();
      const { error } = await jawn.DELETE("/v1/admin/org/{orgId}/member/{memberId}", {
        params: { path: { orgId: org.id, memberId } },
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgSearchFast"] });
      setNotification("Member removed successfully", "success");
    },
    onError: (error: any) => {
      setNotification(error.message || "Failed to remove member", "error");
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const jawn = getJawnClient();
      const { error } = await jawn.PATCH("/v1/admin/org/{orgId}/member/{memberId}", {
        params: { path: { orgId: org.id, memberId } },
        body: { role },
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgSearchFast"] });
      setNotification("Member role updated successfully", "success");
    },
    onError: (error: any) => {
      setNotification(error.message || "Failed to update member role", "error");
    },
  });

  return (
    <>
      {/* Main Row */}
      <tr
        className="cursor-pointer transition-colors hover:bg-muted/50"
        onClick={onToggleExpand}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">{org.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge variant={getTierBadgeVariant(org.tier)} className="text-xs">
            {org.tier}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-muted-foreground">{owner.email}</span>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {org.members.length}
          </span>
        </td>
        <td className="px-4 py-3">
          {lightUsageLoading ? (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <Muted className="text-xs">Loading...</Muted>
            </div>
          ) : lightUsageData?.last_request_at ? (
            <Muted className="text-xs">
              {new Date(lightUsageData.last_request_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Muted>
          ) : (
            <Muted className="text-xs">No requests</Muted>
          )}
        </td>
        <td className="px-4 py-3">
          {lightUsageLoading ? (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <Muted className="text-xs">Loading...</Muted>
            </div>
          ) : (
            <Muted className="text-xs">
              {formatLargeNumber(lightUsageData?.requests_last_30_days || 0)}
            </Muted>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {isExpanded ? (
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

      {/* Expanded Details Row */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-muted/30 px-4 py-6">
            {usageLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <Muted>Loading usage data...</Muted>
              </div>
            ) : usageData ? (
              <div className="flex flex-col gap-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <Small className="font-medium text-muted-foreground">
                      Organization ID
                    </Small>
                    <Muted className="font-mono text-xs">{org.id}</Muted>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Small className="font-medium text-muted-foreground">
                      Created
                    </Small>
                    <Muted>
                      {new Date(org.created_at).toLocaleDateString()}
                    </Muted>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Small className="font-medium text-muted-foreground">
                      Subscription
                    </Small>
                    <Muted>{org.subscription_status || "N/A"}</Muted>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Small className="font-medium text-muted-foreground">
                      Owner Email
                    </Small>
                    {owner.email && owner.email !== "N/A" ? (
                      <a
                        href={`/admin/org-search?q=${encodeURIComponent(owner.email)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer font-mono text-xs text-blue-600 hover:underline dark:text-blue-400 break-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          window.open(`/admin/org-search?q=${encodeURIComponent(owner.email)}`, '_blank');
                        }}
                      >
                        {owner.email}
                      </a>
                    ) : (
                      <Muted className="font-mono text-xs">N/A</Muted>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Small className="font-medium text-muted-foreground">
                      Stripe Customer ID
                    </Small>
                    {org.stripe_customer_id ? (
                      <a
                        href={`https://dashboard.stripe.com/customers/${org.stripe_customer_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer font-mono text-xs text-blue-600 hover:underline dark:text-blue-400 break-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          window.open(`https://dashboard.stripe.com/customers/${org.stripe_customer_id}`, '_blank');
                        }}
                      >
                        {org.stripe_customer_id}
                      </a>
                    ) : (
                      <Muted className="font-mono text-xs">N/A</Muted>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Small className="font-medium text-muted-foreground">
                      Total Requests
                    </Small>
                    <Muted className="font-semibold">
                      {formatLargeNumber(usageData.total_requests)}
                    </Muted>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Small className="font-medium text-muted-foreground">
                      Last 30 Days
                    </Small>
                    <Muted className="font-semibold">
                      {formatLargeNumber(usageData.requests_last_30_days)}
                    </Muted>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Small className="font-medium text-muted-foreground">
                      All-Time Count
                    </Small>
                    <Muted className="font-semibold">
                      {formatLargeNumber(usageData.all_time_count)}
                    </Muted>
                  </div>
                </div>

                {/* Monthly Usage Chart */}
                <div className="flex flex-col gap-2">
                  <Small className="font-medium">Monthly Usage (Last 12 Months)</Small>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <BarChart
                      data={sortAndFormatMonthlyUsage(usageData.monthly_usage)}
                      categories={["requestCount"]}
                      index="month"
                      showYAxis={true}
                      className="h-60"
                    />
                  </div>
                </div>

                {/* Organization Members */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Small className="font-medium">
                      Organization Members ({org.members.length})
                    </Small>
                    <AddAdminDialog orgId={org.id} orgName={org.name} />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Role
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {org.members.map((member: any) => (
                          <tr key={member.id}>
                            <td className="whitespace-nowrap px-4 py-2 text-sm">
                              {member.name || "N/A"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-sm">
                              {member.email}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-sm">
                              <Select
                                value={member.role}
                                onValueChange={(newRole) => {
                                  updateRoleMutation.mutate({
                                    memberId: member.id,
                                    role: newRole,
                                  });
                                }}
                              >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="owner">Owner</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-sm text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    confirm(
                                      `Remove ${member.email} from ${org.name}?`
                                    )
                                  ) {
                                    removeMemberMutation.mutate(member.id);
                                  }
                                }}
                                disabled={removeMemberMutation.isPending}
                              >
                                <Trash2 size={14} className="text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </td>
        </tr>
      )}
    </>
  );
};

export default OrgSearch;

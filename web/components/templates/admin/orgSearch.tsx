import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { getJawnClient } from "@/lib/clients/jawn";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { BarChart as TremorBarChart } from "@tremor/react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Search, Loader2, Trash2, UserPlus, X, Copy } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

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
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["orgSearchFast", debouncedSearchQuery],
      queryFn: async ({ pageParam = 0 }) => {
        const jawn = getJawnClient();
        const { data, error } = await jawn.POST("/v1/admin/org-search-fast", {
          body: { query: debouncedSearchQuery, limit, offset: pageParam as number },
        });

        if (error) throw error;
        return data;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        if (!(lastPage as any)?.hasMore) return undefined;
        return allPages.length * limit;
      },
      enabled: debouncedSearchQuery.trim().length > 0,
    });

  // Flatten all organizations from all pages
  const allOrganizations =
    data?.pages.flatMap((page: any) => page.organizations) ?? [];

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
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          query,
        );

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
      { threshold: 0.1 },
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
        const { data, error } = await jawn.GET(
          "/v1/admin/org-usage-light/{orgId}",
          {
            params: { path: { orgId } },
          },
        );

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
  };

  // Fetch feature flags for table rows (async, non-blocking)
  const useOrgFeatureFlags = (orgId: string) => {
    return useQuery({
      queryKey: ["org-feature-flags", orgId],
      queryFn: async () => {
        const jawn = getJawnClient();
        const { data, error } = await jawn.POST(
          "/v1/admin/feature-flags/query",
          {},
        );
        if (error) throw error;
        return data?.data?.find((org: any) => org.organization_id === orgId);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleExpand = (orgId: string) => {
    setExpandedOrg(expandedOrg === orgId ? null : orgId);
  };

  const sortAndFormatMonthlyUsage = (monthlyUsage: any[]) => {
    // Generate last 12 months
    const last12Months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last12Months.push({
        date,
        monthKey: date.toISOString().slice(0, 7), // YYYY-MM format
        month: date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        }),
      });
    }

    // Create maps for usage and cost data
    const usageMap = new Map(
      monthlyUsage.map((item) => [
        new Date(item.month).toISOString().slice(0, 7),
        {
          requestCount: item.requestCount || 0,
          cost: item.cost || 0,
        },
      ]),
    );

    // Fill in all 12 months with data or 0
    return last12Months.map(({ monthKey, month }) => {
      const data = usageMap.get(monthKey) || { requestCount: 0, cost: 0 };
      return {
        month,
        requestCount: data.requestCount,
        cost: data.cost,
      };
    });
  };

  const getOwnerFromMembers = (
    members: {
      id: string;
      email: string;
      name: string;
      role: string;
      last_sign_in_at: string | null;
      created_at: string | null;
    }[],
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
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-6">
      <div className="flex items-center gap-2">
        <Small className="font-medium text-muted-foreground">Organizations</Small>
      </div>
      <div className="flex w-full max-w-2xl flex-shrink-0 gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations..."
            className="rounded-none pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="overflow-hidden border border-border">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-muted">
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
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Feature Flags
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-16 bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-40 bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-16 bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 bg-muted" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="ml-auto h-4 w-16 bg-muted" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State - Before Search */}
        {!debouncedSearchQuery && !isLoading && (
          <Card className="rounded-none border-dashed">
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
            <Card className="rounded-none border-dashed">
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
            <div className="overflow-hidden border border-border">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-muted">
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
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Feature Flags
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allOrganizations.map((org, index) => {
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
                        useOrgFeatureFlags={useOrgFeatureFlags}
                        getTierBadgeVariant={getTierBadgeVariant}
                        sortAndFormatMonthlyUsage={sortAndFormatMonthlyUsage}
                        rowIndex={index}
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
const AddAdminDialog = ({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) => {
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
      setNotification(
        error.message || "Failed to add admins to organization",
        "error",
      );
    },
  });

  const handleToggleAdmin = (adminId: string) => {
    setSelectedAdminIds((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId],
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
          <DialogDescription>Add admin users to {orgName}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <Muted>Loading admins...</Muted>
            </div>
          ) : (
            <>
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                <Small className="font-medium">Select Admins</Small>
                {adminsData?.data?.map((admin) => (
                  <label
                    key={admin.user_id}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-muted"
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

              <div className="flex justify-end gap-2 border-t border-border pt-4">
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
                  disabled={
                    addAdminToOrgMutation.isPending ||
                    selectedAdminIds.length === 0
                  }
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
  useOrgFeatureFlags,
  getTierBadgeVariant,
  sortAndFormatMonthlyUsage,
  rowIndex,
}: {
  org: any;
  owner: { name: string; email: string };
  isExpanded: boolean;
  onToggleExpand: () => void;
  useOrgUsage: (orgId: string | null) => any;
  useOrgUsageLight: (orgId: string) => any;
  useOrgFeatureFlags: (orgId: string) => any;
  getTierBadgeVariant: (tier: string) => any;
  sortAndFormatMonthlyUsage: (monthlyUsage: any[]) => any[];
  rowIndex: number;
}) => {
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [deleteOrgDialogOpen, setDeleteOrgDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [roleChange, setRoleChange] = useState<{
    memberId: string;
    memberEmail: string;
    oldRole: string;
    newRole: string;
  } | null>(null);

  // Track if row is visible using Intersection Observer
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRow = rowRef.current;
    if (currentRow) {
      observer.observe(currentRow);
    }

    return () => {
      if (currentRow) {
        observer.unobserve(currentRow);
      }
    };
  }, []);

  // Add staggered delay before fetching (100ms per row)
  useEffect(() => {
    if (isVisible) {
      const delay = rowIndex * 100; // Stagger by 100ms per row
      const timer = setTimeout(() => {
        setShouldFetch(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, rowIndex]);

  // Fetch lightweight usage stats only when visible and after delay
  const { data: lightUsageData, isLoading: lightUsageLoading } = useQuery({
    queryKey: ["orgUsageLight", org.id],
    queryFn: async () => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.GET(
        "/v1/admin/org-usage-light/{orgId}",
        {
          params: { path: { orgId: org.id } },
        }
      );

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: shouldFetch, // Only fetch when visible and after delay
  });

  // Fetch feature flags only when visible and after delay
  const { data: featureFlagsData, isLoading: featureFlagsLoading } = useQuery({
    queryKey: ["org-feature-flags", org.id],
    queryFn: async () => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST(
        "/v1/admin/feature-flags/query",
        {},
      );
      if (error) throw error;
      return data?.data?.find((orgData: any) => orgData.organization_id === org.id);
    },
    staleTime: 5 * 60 * 1000,
    enabled: shouldFetch, // Only fetch when visible and after delay
  });

  // Only fetch full usage data when expanded
  const { data: usageData, isLoading: usageLoading } = useOrgUsage(
    isExpanded ? org.id : null,
  );

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const jawn = getJawnClient();
      const { error } = await jawn.DELETE(
        "/v1/admin/org/{orgId}/member/{memberId}",
        {
          params: { path: { orgId: org.id, memberId } },
        },
      );
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
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: string;
    }) => {
      const jawn = getJawnClient();
      const { error } = await jawn.PATCH(
        "/v1/admin/org/{orgId}/member/{memberId}",
        {
          params: { path: { orgId: org.id, memberId } },
          body: { role },
        },
      );
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgSearchFast"] });
      setNotification("Member role updated successfully", "success");
      setChangeRoleDialogOpen(false);
      setRoleChange(null);
    },
    onError: (error: any) => {
      setNotification(error.message || "Failed to update member role", "error");
    },
  });

  // Delete org mutation
  const deleteOrgMutation = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient();
      const { error } = await jawn.POST("/v1/admin/org/{orgId}/delete", {
        params: { path: { orgId: org.id } },
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgSearchFast"] });
      setNotification("Organization cleaned up successfully", "success");
      setDeleteOrgDialogOpen(false);
    },
    onError: (error: any) => {
      setNotification(error.message || "Failed to delete organization", "error");
    },
  });

  const confirmDeleteMember = () => {
    if (memberToDelete) {
      removeMemberMutation.mutate(memberToDelete.id);
      setDeleteMemberDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const confirmRoleChange = () => {
    if (roleChange) {
      updateRoleMutation.mutate({
        memberId: roleChange.memberId,
        role: roleChange.newRole,
      });
    }
  };

  const confirmDeleteOrg = () => {
    deleteOrgMutation.mutate();
  };

  return (
    <>
      {/* Main Row */}
      <tr
        ref={rowRef}
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
              {new Date(lightUsageData.last_request_at).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
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
        <td className="px-4 py-3">
          {featureFlagsLoading ? (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="relative max-w-[200px]">
              <div className="flex gap-1 overflow-hidden">
                {featureFlagsData?.flags && featureFlagsData.flags.length > 0 ? (
                  featureFlagsData.flags.map((flag: string) => (
                    <Badge
                      key={flag}
                      variant="secondary"
                      className="shrink-0 text-xs px-1.5 py-0"
                    >
                      {flag}
                    </Badge>
                  ))
                ) : (
                  <Muted className="text-xs">-</Muted>
                )}
              </div>
              {featureFlagsData?.flags && featureFlagsData.flags.length > 0 && (
                <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
              )}
            </div>
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
          <td colSpan={8} className="bg-muted/30 px-4 py-6">
            <div className="flex flex-col gap-6">
                {/* Quick Stats + Chart - Side by Side */}
                <div className="grid grid-cols-1 gap-4 border border-border bg-background p-4 lg:grid-cols-[350px_1fr]">
                  {/* Left: Stats */}
                  <div className="flex flex-col gap-4">
                    {/* Org Info Section */}
                    <div className="flex flex-col gap-2">
                      <Small className="font-semibold text-foreground">
                        Organization
                      </Small>
                      <div className="flex flex-col gap-2 pl-2">
                        <div className="flex items-center justify-between gap-3">
                          <Small className="min-w-[70px] text-muted-foreground">
                            ID
                          </Small>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-mono h-6 flex-1 justify-between px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(org.id);
                              setNotification(
                                "Organization ID copied",
                                "success",
                              );
                            }}
                          >
                            {org.id.slice(0, 8)}...
                            <Copy size={12} />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Small className="min-w-[70px] text-muted-foreground">
                            Created
                          </Small>
                          <Muted className="text-xs">
                            {new Date(org.created_at).toLocaleDateString()}
                          </Muted>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Small className="min-w-[70px] text-muted-foreground">
                            Tier
                          </Small>
                          <Muted className="text-xs">
                            {org.subscription_status || "N/A"}
                          </Muted>
                        </div>
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="flex flex-col gap-2 border-t border-border pt-2">
                      <Small className="font-semibold text-foreground">
                        Contact
                      </Small>
                      <div className="flex flex-col gap-2 pl-2">
                        <div className="flex items-start justify-between gap-3">
                          <Small className="min-w-[70px] pt-0.5 text-muted-foreground">
                            Owner
                          </Small>
                          {owner.email && owner.email !== "N/A" ? (
                            <a
                              href={`/admin/org-search?q=${encodeURIComponent(owner.email)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 break-all text-right text-xs text-blue-600 hover:underline dark:text-blue-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                window.open(
                                  `/admin/org-search?q=${encodeURIComponent(owner.email)}`,
                                  "_blank",
                                );
                              }}
                            >
                              {owner.email}
                            </a>
                          ) : (
                            <Muted className="text-xs">N/A</Muted>
                          )}
                        </div>
                        {org.stripe_customer_id && (
                          <div className="flex items-center justify-between gap-3">
                            <Small className="min-w-[70px] text-muted-foreground">
                              Stripe
                            </Small>
                            <a
                              href={`https://dashboard.stripe.com/customers/${org.stripe_customer_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 truncate text-right text-xs text-blue-600 hover:underline dark:text-blue-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                window.open(
                                  `https://dashboard.stripe.com/customers/${org.stripe_customer_id}`,
                                  "_blank",
                                );
                              }}
                            >
                              {org.stripe_customer_id}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Usage Stats Section */}
                    <div className="flex flex-col gap-2 border-t border-border pt-2">
                      <Small className="font-semibold text-foreground">
                        Usage
                      </Small>
                      {usageLoading ? (
                        <div className="flex items-center gap-2 py-4 pl-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <Muted className="text-xs">Loading detailed usage...</Muted>
                        </div>
                      ) : usageData ? (
                        <div className="flex flex-col gap-2 pl-2">
                          <div className="flex items-center justify-between gap-3">
                            <Small className="min-w-[70px] text-muted-foreground">
                              Total
                            </Small>
                            <Muted className="text-xs font-semibold">
                              {formatLargeNumber(usageData.total_requests)}
                            </Muted>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <Small className="min-w-[70px] text-muted-foreground">
                              Last 30d
                            </Small>
                            <Muted className="text-xs font-semibold">
                              {formatLargeNumber(usageData.requests_last_30_days)}
                            </Muted>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <Small className="min-w-[70px] text-muted-foreground">
                              All-Time
                            </Small>
                            <Muted className="text-xs font-semibold">
                              {formatLargeNumber(usageData.all_time_count)}
                            </Muted>
                          </div>
                        </div>
                      ) : (
                        <Muted className="pl-2 text-xs">Unable to load usage data</Muted>
                      )}
                    </div>

                    {/* Gateway Discount */}
                    <div className="border-t border-border pt-2">
                      <GatewayDiscountSection
                        orgId={org.id}
                        orgName={org.name}
                        gatewayDiscountEnabled={org.gateway_discount_enabled}
                      />
                    </div>

                    {/* Feature Flags */}
                    <div className="border-t border-border pt-2">
                      <FeatureFlagsSection orgId={org.id} orgName={org.name} />
                    </div>
                  </div>

                  {/* Right: Charts - Match left column height */}
                  <div className="flex flex-col gap-4">
                    {/* Usage Chart */}
                    <div className="flex flex-1 flex-col gap-2">
                      <Small className="font-medium">
                        Monthly Usage (Last 12 Months)
                      </Small>
                      {usageLoading ? (
                        <div className="flex h-[200px] w-full items-center justify-center border border-border bg-muted/10">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <Muted className="text-xs">Loading chart data...</Muted>
                          </div>
                        </div>
                      ) : usageData?.monthly_usage ? (
                        <div className="h-[200px] w-full">
                          <ChartContainer
                            config={{
                              requestCount: {
                                label: "Requests",
                                color: "hsl(200 90% 50%)",
                              },
                            }}
                            className="h-full w-full"
                          >
                            <BarChart
                              data={sortAndFormatMonthlyUsage(
                                usageData.monthly_usage,
                              )}
                              margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
                            >
                              <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                opacity={0.2}
                              />
                              <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={8}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                                fontSize={11}
                              />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    valueFormatter={(value) =>
                                      formatLargeNumber(value as number)
                                    }
                                  />
                                }
                              />
                              <Bar
                                dataKey="requestCount"
                                fill="var(--color-requestCount)"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={35}
                              />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      ) : (
                        <div className="flex h-[200px] w-full items-center justify-center border border-border bg-muted/10">
                          <Muted className="text-xs">Unable to load chart data</Muted>
                        </div>
                      )}
                    </div>

                    {/* Cost Chart */}
                    <div className="flex flex-1 flex-col gap-2">
                      <Small className="font-medium">
                        Monthly Cost (Last 12 Months)
                      </Small>
                      {usageLoading ? (
                        <div className="flex h-[200px] w-full items-center justify-center border border-border bg-muted/10">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <Muted className="text-xs">Loading chart data...</Muted>
                          </div>
                        </div>
                      ) : usageData?.monthly_usage ? (
                        <div className="h-[200px] w-full">
                          <ChartContainer
                            config={{
                              cost: {
                                label: "Cost",
                                color: "hsl(142 76% 36%)",
                              },
                            }}
                            className="h-full w-full"
                          >
                            <BarChart
                              data={sortAndFormatMonthlyUsage(
                                usageData.monthly_usage,
                              )}
                              margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
                            >
                              <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                opacity={0.2}
                              />
                              <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={8}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                                fontSize={11}
                              />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    valueFormatter={(value) =>
                                      `$${(value as number).toFixed(2)}`
                                    }
                                  />
                                }
                              />
                              <Bar
                                dataKey="cost"
                                fill="var(--color-cost)"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={35}
                              />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      ) : (
                        <div className="flex h-[200px] w-full items-center justify-center border border-border bg-muted/10">
                          <Muted className="text-xs">Unable to load chart data</Muted>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Organization Members */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Small className="font-medium">
                      Organization Members ({org.members.length})
                    </Small>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteOrgDialogOpen(true);
                        }}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Org
                      </Button>
                      <AddAdminDialog orgId={org.id} orgName={org.name} />
                    </div>
                  </div>
                  <div className="overflow-hidden border border-border">
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
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Last Sign In
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Created At
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
                                  setRoleChange({
                                    memberId: member.id,
                                    memberEmail: member.email,
                                    oldRole: member.role,
                                    newRole,
                                  });
                                  setChangeRoleDialogOpen(true);
                                }}
                              >
                                <SelectTrigger className="h-7 w-32 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="owner">Owner</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                              {member.last_sign_in_at
                                ? new Date(member.last_sign_in_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : "Never"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                              {member.created_at
                                ? new Date(member.created_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )
                                : "N/A"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMemberToDelete({
                                    id: member.id,
                                    email: member.email,
                                  });
                                  setDeleteMemberDialogOpen(true);
                                }}
                                disabled={removeMemberMutation.isPending}
                              >
                                <Trash2
                                  size={14}
                                  className="text-destructive"
                                />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          </td>
        </tr>
      )}

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">{memberToDelete?.email}</span> from{" "}
              {org.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteMemberDialogOpen(false);
                setMemberToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMember}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Confirmation Dialog */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to change{" "}
              <span className="font-medium">{roleChange?.memberEmail}</span>'s role
              from <span className="font-medium">{roleChange?.oldRole}</span> to{" "}
              <span className="font-medium">{roleChange?.newRole}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setChangeRoleDialogOpen(false);
                setRoleChange(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Change Role"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Confirmation Dialog */}
      <Dialog open={deleteOrgDialogOpen} onOpenChange={setDeleteOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to clean up{" "}
              <span className="font-medium">{org.name}</span>? This will:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Reassign ownership to cole+10@helicone.ai</li>
                <li>Remove all current members from the organization</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOrgDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteOrg}
              disabled={deleteOrgMutation.isPending}
            >
              {deleteOrgMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Organization"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Feature Flags Section Component
const FeatureFlagsSection = ({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) => {
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  const [newFlag, setNewFlag] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [flagToDelete, setFlagToDelete] = useState<string | null>(null);

  // Fetch feature flags for this org
  const { data: featureFlagsData, isLoading: isLoadingFlags } = useQuery({
    queryKey: ["org-feature-flags", orgId],
    queryFn: async () => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST(
        "/v1/admin/feature-flags/query",
        {},
      );
      if (error) throw error;
      // Find flags for this specific org
      return data?.data?.find((org: any) => org.organization_id === orgId);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Add feature flag mutation
  const addFeatureFlagMutation = useMutation({
    mutationFn: async (flag: string) => {
      const jawn = getJawnClient();
      const { error } = await jawn.POST("/v1/admin/feature-flags", {
        body: { flag, orgId },
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-feature-flags", orgId] });
      setNotification("Feature flag added successfully", "success");
      setNewFlag("");
    },
    onError: (error: any) => {
      setNotification(error.message || "Failed to add feature flag", "error");
    },
  });

  // Delete feature flag mutation
  const deleteFeatureFlagMutation = useMutation({
    mutationFn: async (flag: string) => {
      const jawn = getJawnClient();
      const { error } = await jawn.DELETE("/v1/admin/feature-flags", {
        body: { flag, orgId },
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-feature-flags", orgId] });
      setNotification("Feature flag removed successfully", "success");
    },
    onError: (error: any) => {
      setNotification(
        error.message || "Failed to remove feature flag",
        "error",
      );
    },
  });

  const handleAddFlag = () => {
    if (!newFlag.trim()) {
      setNotification("Please enter a feature flag name", "error");
      return;
    }
    setAddDialogOpen(true);
  };

  const confirmAddFlag = () => {
    addFeatureFlagMutation.mutate(newFlag.trim());
    setAddDialogOpen(false);
  };

  const confirmDeleteFlag = () => {
    if (flagToDelete) {
      deleteFeatureFlagMutation.mutate(flagToDelete);
      setDeleteDialogOpen(false);
      setFlagToDelete(null);
    }
  };

  const flags = featureFlagsData?.flags || [];

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <Small className="font-medium">Feature Flags</Small>
        {!isLoadingFlags && (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Add flag..."
              value={newFlag}
              onChange={(e) => setNewFlag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddFlag();
                }
              }}
              className="h-7 w-40 text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddFlag}
              disabled={addFeatureFlagMutation.isPending || !newFlag.trim()}
              className="h-7 px-2"
            >
              {addFeatureFlagMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          </div>
        )}
      </div>

      {isLoadingFlags ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <Muted className="text-xs">Loading...</Muted>
        </div>
      ) : (
        <div className="flex min-h-[2rem] flex-wrap gap-2 border border-border bg-background p-2">
          {flags.length > 0 ? (
            flags.map((flag: string) => (
              <Badge
                key={flag}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-0.5"
              >
                <span className="text-xs">{flag}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlagToDelete(flag);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={deleteFeatureFlagMutation.isPending}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            ))
          ) : (
            <Muted className="py-1 text-xs">No feature flags</Muted>
          )}
        </div>
      )}

      {/* Delete Feature Flag Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feature Flag</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the feature flag{" "}
              <span className="font-medium">"{flagToDelete}"</span> from{" "}
              {orgName}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setFlagToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteFlag}
              disabled={deleteFeatureFlagMutation.isPending}
            >
              {deleteFeatureFlagMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Feature Flag Confirmation Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feature Flag</DialogTitle>
            <DialogDescription>
              Are you sure you want to add the feature flag{" "}
              <span className="font-medium">"{newFlag}"</span> to {orgName}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddFlag}
              disabled={addFeatureFlagMutation.isPending}
            >
              {addFeatureFlagMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Gateway Discount Section Component
const GatewayDiscountSection = ({
  orgId,
  orgName,
  gatewayDiscountEnabled,
}: {
  orgId: string;
  orgName: string;
  gatewayDiscountEnabled: boolean;
}) => {
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);

  // Update gateway discount mutation
  const updateGatewayDiscountMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const jawn = getJawnClient();
      const { error } = await jawn.PATCH("/v1/admin/org/{orgId}/gateway-discount", {
        params: { path: { orgId } },
        body: { enabled },
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgSearchFast"] });
      setNotification("Gateway discount updated successfully", "success");
      setConfirmDialogOpen(false);
      setPendingValue(null);
    },
    onError: (error: any) => {
      setNotification(
        error.message || "Failed to update gateway discount",
        "error",
      );
      setPendingValue(null);
    },
  });

  const handleToggle = (checked: boolean) => {
    setPendingValue(checked);
    setConfirmDialogOpen(true);
  };

  const confirmToggle = () => {
    if (pendingValue !== null) {
      updateGatewayDiscountMutation.mutate(pendingValue);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <Small className="font-medium">Gateway Discount</Small>
        <div className="flex items-center gap-2">
          <Switch
            checked={gatewayDiscountEnabled}
            onCheckedChange={handleToggle}
            disabled={updateGatewayDiscountMutation.isPending}
          />
          <Small className="text-muted-foreground">
            {gatewayDiscountEnabled ? "Enabled" : "Disabled"}
          </Small>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Gateway Discount</DialogTitle>
            <DialogDescription>
              Are you sure you want to {pendingValue ? "enable" : "disable"} gateway
              discount for <span className="font-medium">{orgName}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setPendingValue(null);
              }}
              disabled={updateGatewayDiscountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggle}
              disabled={updateGatewayDiscountMutation.isPending}
            >
              {updateGatewayDiscountMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgSearch;

import {
  calculateNetAmount,
  dollarsToCents,
} from "@helicone-package/common/stripe/feeCalculator";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H4, Small } from "@/components/ui/typography";
import { $JAWN_API, getJawnClient } from "@/lib/clients/jawn";
import { formatCurrency as remoteFormatCurrency } from "@/lib/uiUtils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { WalletAnalyticsCharts } from "./WalletAnalyticsCharts";
import { ThemedTimeFilterShadCN } from "@/components/shared/themed/themedTimeFilterShadCN";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  DollarSign,
  ExternalLink,
  Loader2,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef } from "react";

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return "UNDEFINED";
  return remoteFormatCurrency(amount, "USD", 2);
};

type SortColumn =
  | "org_created_at"
  | "total_payments"
  | "total_spend"
  | "credit_limit"
  | "amount_received";

export default function AdminWallet() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [sortBy, setSortBy] = useState<SortColumn>("total_spend");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [copiedOrgId, setCopiedOrgId] = useState<string | null>(null);

  // Delete disallow entry state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{
    provider: string;
    model: string;
  } | null>(null);

  // Wallet modification form state
  const [modifyAmount, setModifyAmount] = useState<string>("");
  const [modifyType, setModifyType] = useState<"credit" | "debit">("credit");
  const [modifyReason, setModifyReason] = useState<string>("");
  const [isModifying, setIsModifying] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [modifySuccess, setModifySuccess] = useState<string | null>(null);

  // Wallet settings form state
  const [allowNegativeBalance, setAllowNegativeBalance] =
    useState<boolean>(false);
  const [creditLimit, setCreditLimit] = useState<string>("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Time-series analytics date range state (default: last 30 days)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Time-series granularity state (default: day)
  const [groupBy, setGroupBy] = useState<
    "minute" | "hour" | "day" | "week" | "month"
  >("day");

  // Fetch dashboard data with infinite scroll
  const limit = 50;
  const {
    data,
    isLoading: dashboardLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchDashboard,
    error: queryError,
  } = useInfiniteQuery({
    queryKey: ["walletDashboard", searchQuery, sortBy, sortOrder],
    queryFn: async ({ pageParam = 0 }) => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST(
        "/v1/admin/wallet/gateway/dashboard_data",
        {
          params: {
            query: {
              search: searchQuery || undefined,
              sortBy: sortBy,
              sortOrder: sortOrder,
            },
          },
        },
      );

      if (error) throw error;

      // The API returns { data: { organizations: [...], summary: {...} } }
      // But the jawn client might unwrap it differently
      const responseData = (data as any).data || data;
      const orgs = responseData.organizations || [];
      const offset = pageParam as number;
      const paginatedOrgs = orgs.slice(offset, offset + limit);

      return {
        data: {
          ...responseData,
          organizations: paginatedOrgs,
        },
        hasMore: offset + limit < orgs.length,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!(lastPage as any)?.hasMore) return undefined;
      return allPages.length * limit;
    },
  });

  const dashboardError = queryError?.message || (data?.pages[0] as any)?.error;

  // Flatten paginated results
  const dashboardData = data?.pages[0]; // For summary stats (has data.summary)
  const allOrganizations =
    data?.pages.flatMap((page: any) => page.data?.organizations || []) || [];

  // Fetch wallet details (lazy loaded when org is selected)
  const {
    data: walletDetailsResponse,
    isLoading: walletLoading,
    refetch: refetchWalletDetails,
  } = $JAWN_API.useQuery(
    "post",
    "/v1/admin/wallet/{orgId}",
    {
      params: {
        path: {
          orgId: selectedOrg || "",
        },
      },
    },
    {
      enabled: !!selectedOrg,
    },
  );

  const walletDetails = (walletDetailsResponse as any)?.data;

  // Mutation for modifying wallet balance
  const modifyBalanceMutation = $JAWN_API.useMutation(
    "post",
    "/v1/admin/wallet/{orgId}/modify-balance",
  );

  // Mutation for updating wallet settings
  const updateSettingsMutation = $JAWN_API.useMutation(
    "post",
    "/v1/admin/wallet/{orgId}/update-settings",
  );

  // Mutation for deleting from disallow list
  const deleteDisallowMutation = $JAWN_API.useMutation(
    "delete",
    "/v1/admin/wallet/{orgId}/disallow-list",
  );

  // Fetch table data (lazy loaded when table is selected)
  const { data: tableData, isLoading: tableLoading } = $JAWN_API.useQuery(
    "post",
    "/v1/admin/wallet/{orgId}/tables/{tableName}",
    {
      params: {
        path: {
          orgId: selectedOrg || "",
          tableName: selectedTable || "",
        },
        query: {
          page: tablePage,
          pageSize: 50,
        },
      },
    },
    {
      enabled: !!selectedOrg && !!selectedTable,
    },
  );

  // Fetch time-series analytics data
  const {
    data: timeSeriesData,
    isLoading: timeSeriesLoading,
    error: timeSeriesError,
  } = useQuery({
    queryKey: [
      "walletTimeSeries",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      groupBy,
    ],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) {
        return { deposits: [], spend: [] };
      }

      const jawn = getJawnClient();
      const { data, error } = await jawn.POST(
        "/v1/admin/wallet/analytics/time-series",
        {
          params: {
            query: {
              startDate: dateRange.from.toISOString(),
              endDate: dateRange.to.toISOString(),
              groupBy: groupBy,
            },
          },
        },
      );

      if (error) throw error;

      const responseData = (data as any)?.data || data;
      return {
        deposits: responseData?.deposits || [],
        spend: responseData?.spend || [],
      };
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const handleSearch = () => {
    setSearchQuery(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchQuery("");
  };

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="ml-1" />
    ) : (
      <ArrowDown size={14} className="ml-1" />
    );
  };

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
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

  const handleOrgClick = (orgId: string) => {
    if (selectedOrg === orgId) {
      setSelectedOrg(null);
    } else {
      setSelectedOrg(orgId);
      // Reset table selection when switching orgs
      setSelectedTable(null);
      setTablePage(0);
      // Reset settings form
      setSettingsError(null);
      setSettingsSuccess(null);
      setModifyError(null);
      setModifySuccess(null);
      // Load current settings from the org data
      const org = dashboardData?.data?.organizations.find(
        (o: any) => o.orgId === orgId,
      );
      if (org) {
        setAllowNegativeBalance(org.allowNegativeBalance || false);
        setCreditLimit(org.creditLimit ? org.creditLimit.toString() : "0");
      }
    }
  };

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    setTablePage(0); // Reset to first page when switching tables
  };

  const handleModifyBalance = async () => {
    if (!selectedOrg) return;

    // Reset messages
    setModifyError(null);
    setModifySuccess(null);

    // Validate inputs
    const amount = parseFloat(modifyAmount);
    if (isNaN(amount) || amount <= 0) {
      setModifyError("Please enter a valid positive amount");
      return;
    }

    if (!modifyReason.trim()) {
      setModifyError("Please provide a reason for this modification");
      return;
    }

    setIsModifying(true);

    try {
      const result = await modifyBalanceMutation.mutateAsync({
        params: {
          path: { orgId: selectedOrg },
          query: {
            amount,
            type: modifyType,
            reason: modifyReason,
          },
        },
      });

      if (result.error) {
        setModifyError(result.error);
      } else {
        setModifySuccess(
          `Successfully ${modifyType === "credit" ? "added" : "deducted"} ${formatCurrency(amount)}`,
        );
        // Reset form
        setModifyAmount("");
        setModifyReason("");
        // Refetch wallet details
        refetchWalletDetails();
      }
    } catch (error) {
      setModifyError(
        error instanceof Error ? error.message : "Failed to modify balance",
      );
    } finally {
      setIsModifying(false);
    }
  };

  const handleDeleteDisallowEntry = async () => {
    if (!selectedOrg || !entryToDelete) return;

    try {
      const result = await deleteDisallowMutation.mutateAsync({
        params: {
          path: { orgId: selectedOrg },
          query: {
            provider: entryToDelete.provider,
            model: entryToDelete.model,
          },
        },
      });

      if (result.data) {
        // Refetch wallet details to update the list
        await refetchWalletDetails();
      }
    } catch (error) {
      console.error("Error deleting from disallow list:", error);
    } finally {
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedOrg) return;

    // Reset messages
    setSettingsError(null);
    setSettingsSuccess(null);

    // Validate that at least one field is set
    const limitValue = creditLimit.trim() ? parseFloat(creditLimit) : undefined;

    if (limitValue !== undefined && (isNaN(limitValue) || limitValue < 0)) {
      setSettingsError("Credit limit must be a non-negative number");
      return;
    }

    setIsUpdatingSettings(true);

    try {
      const result = await updateSettingsMutation.mutateAsync({
        params: {
          path: { orgId: selectedOrg },
          query: {
            allowNegativeBalance,
            creditLimit: limitValue,
          },
        },
      });

      if (result.error) {
        setSettingsError(result.error);
      } else {
        setSettingsSuccess(`Successfully updated wallet settings`);
        // Update form with returned values
        if (result.data) {
          setAllowNegativeBalance(result.data.allowNegativeBalance);
          setCreditLimit(result.data.creditLimit?.toString() ?? "0");
        }
        // Refresh dashboard data to update the table
        refetchDashboard();
      }
    } catch (error) {
      setSettingsError(
        error instanceof Error ? error.message : "Failed to update settings",
      );
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden p-6">
      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* Dashboard Tab */}
        <TabsContent
          value="dashboard"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-3 data-[state=inactive]:hidden"
        >
          {/* Search Bar with Summary and Tabs */}
        <div className="flex shrink-0 items-center justify-between gap-4">
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by org name, ID, owner email, or Stripe customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={dashboardLoading} variant="default">
              {dashboardLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
            {searchQuery && (
              <Button
                type="button"
                onClick={handleClearSearch}
                disabled={dashboardLoading}
                variant="outline"
              >
                Clear
              </Button>
            )}
          </form>

          {/* Summary Stats - Compact */}
          <div className="flex items-center gap-4 border-l pl-4">
            {dashboardLoading ? (
              <Loader2
                size={16}
                className="animate-spin text-muted-foreground"
              />
            ) : dashboardError ? (
              <Small className="text-red-600">Error loading summary</Small>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Orgs</span>
                    <span className="text-sm font-semibold">
                      {dashboardData?.data?.summary?.totalOrgsWithCredits || 0}
                    </span>
                  </div>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Issued
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(
                        dashboardData?.data?.summary?.totalCreditsIssued || 0,
                      )}
                    </span>
                  </div>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Spent</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(
                        dashboardData?.data?.summary?.totalCreditsSpent || 0,
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tabs Navigation */}
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </div>

        {/* Organizations Table */}
        <div
          className="relative min-h-0 w-full flex-1 overflow-auto border"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "hsl(var(--border)) transparent",
          }}
        >
          {dashboardLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2
                size={24}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : dashboardError ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
                <p className="text-red-600">Error loading dashboard data</p>
                <Small className="text-muted-foreground">
                  {dashboardError}
                </Small>
              </div>
            </div>
          ) : (
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead
                    className="w-48 cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("org_created_at")}
                  >
                    <div className="flex items-center">
                      Organization
                      <SortIcon column="org_created_at" />
                    </div>
                  </TableHead>
                  <TableHead className="w-48">Owner</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("total_payments")}
                  >
                    <div className="flex items-center">
                      Deposited
                      <SortIcon column="total_payments" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("total_spend")}
                  >
                    <div className="flex items-center">
                      Spent (CH)
                      <SortIcon column="total_spend" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("total_payments")}
                  >
                    <div className="flex items-center">
                      Net Balance
                      <SortIcon column="total_payments" />
                    </div>
                  </TableHead>
                  <TableHead>Wallet (Live)</TableHead>
                  <TableHead>Drift</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("credit_limit")}
                  >
                    <div className="flex items-center">
                      Credit Limit
                      <SortIcon column="credit_limit" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOrganizations?.map((org) => {
                  // Calculate net amount after removing Stripe fees
                  const totalGrossCents = dollarsToCents(org.totalPayments);
                  const totalNetCents = calculateNetAmount(
                    totalGrossCents,
                    org.paymentsCount || 0,
                  );
                  const totalNetDollars = totalNetCents / 100;

                  const netBalance = totalNetDollars - org.clickhouseTotalSpend;
                  const isNegativeBalance = netBalance < 0;

                  // Calculate drift between net balance and wallet
                  const drift =
                    org.walletBalance !== undefined
                      ? netBalance - org.walletBalance
                      : undefined;
                  const absDrift = drift !== undefined ? Math.abs(drift) : 0;
                  const driftWarning = absDrift > 100;
                  const driftCritical = absDrift > 500;

                  return [
                    <TableRow
                      key={org.orgId}
                      className={`cursor-pointer ${selectedOrg === org.orgId ? "bg-muted" : ""}`}
                      onClick={() => handleOrgClick(org.orgId)}
                    >
                      <TableCell className="max-w-48">
                        <div className="flex items-center gap-2">
                          <span
                            className="truncate font-medium"
                            title={org.orgName}
                          >
                            {org.orgName}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 flex-shrink-0 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(org.orgId);
                              setCopiedOrgId(org.orgId);
                              setTimeout(() => setCopiedOrgId(null), 2000);
                            }}
                          >
                            {copiedOrgId === org.orgId ? (
                              <Check size={12} className="text-green-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <Small
                          className="block truncate text-muted-foreground"
                          title={org.ownerEmail}
                        >
                          {org.ownerEmail}
                        </Small>
                      </TableCell>
                      {/* Deposited */}
                      <TableCell className="whitespace-nowrap">
                        {formatCurrency(totalNetDollars)}
                      </TableCell>
                      {/* Spent (CH) */}
                      <TableCell className="whitespace-nowrap">
                        {formatCurrency(org.clickhouseTotalSpend)}
                      </TableCell>
                      {/* Net Balance */}
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={
                            isNegativeBalance ? "font-medium text-red-500" : ""
                          }
                        >
                          {formatCurrency(netBalance)}
                        </span>
                      </TableCell>
                      {/* Wallet (Live) */}
                      <TableCell className="whitespace-nowrap">
                        {org.walletBalance !== undefined ? (
                          <span
                            className={
                              org.walletBalance < 0
                                ? "font-medium text-red-500"
                                : ""
                            }
                          >
                            {formatCurrency(org.walletBalance)}
                          </span>
                        ) : (
                          <Small className="text-muted-foreground">N/A</Small>
                        )}
                      </TableCell>
                      {/* Drift */}
                      <TableCell className="whitespace-nowrap">
                        {drift !== undefined ? (
                          <span
                            className={
                              driftCritical
                                ? "font-medium text-red-500"
                                : driftWarning
                                  ? "font-medium text-yellow-600"
                                  : absDrift < 10
                                    ? "text-green-600"
                                    : ""
                            }
                          >
                            {drift > 0 ? "+" : ""}
                            {formatCurrency(drift)}
                          </span>
                        ) : (
                          <Small className="text-muted-foreground">N/A</Small>
                        )}
                      </TableCell>
                      {/* Credit Limit */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">
                            {formatCurrency(org.creditLimit || 0)}
                          </span>
                          <span
                            className={
                              org.allowNegativeBalance
                                ? "text-xs text-green-600"
                                : "text-xs text-muted-foreground"
                            }
                          >
                            ({org.allowNegativeBalance ? "✓" : "✗"})
                          </span>
                        </div>
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {org.stripeCustomerId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                const stripeUrl = dashboardData?.data
                                  ?.isProduction
                                  ? `https://dashboard.stripe.com/customers/${org.stripeCustomerId}`
                                  : `https://dashboard.stripe.com/test/customers/${org.stripeCustomerId}`;
                                window.open(stripeUrl, "_blank");
                              }}
                            >
                              <ExternalLink size={14} />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrgClick(org.orgId);
                            }}
                          >
                            {selectedOrg === org.orgId ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>,
                    selectedOrg === org.orgId && walletDetails && (
                      <TableRow key={`${org.orgId}-details`}>
                        <TableCell colSpan={9} className="bg-muted/30 p-6">
                          {walletLoading ? (
                            <div className="flex h-32 items-center justify-center">
                              <Loader2 size={20} className="animate-spin" />
                            </div>
                          ) : walletDetails ? (
                            <div className="flex flex-col gap-6">
                              {/* Overview */}
                              <div className="flex flex-col gap-3">
                                <H4>Overview</H4>
                                <div className="flex items-center gap-6">
                                  <div className="flex flex-col gap-1">
                                    <Small className="text-muted-foreground">
                                      Balance
                                    </Small>
                                    <span className="text-base font-semibold">
                                      {formatCurrency(walletDetails.balance)}
                                    </span>
                                  </div>
                                  <div className="h-8 w-px bg-border" />
                                  <div className="flex flex-col gap-1">
                                    <Small className="text-muted-foreground">
                                      Effective Balance
                                    </Small>
                                    <span className="text-base font-semibold">
                                      {formatCurrency(
                                        walletDetails.effectiveBalance,
                                      )}
                                    </span>
                                  </div>
                                  <div className="h-8 w-px bg-border" />
                                  <div className="flex flex-col gap-1">
                                    <Small className="text-muted-foreground">
                                      Total Credits
                                    </Small>
                                    <span className="text-base font-semibold">
                                      {formatCurrency(
                                        walletDetails.totalCredits,
                                      )}
                                    </span>
                                  </div>
                                  <div className="h-8 w-px bg-border" />
                                  <div className="flex flex-col gap-1">
                                    <Small className="text-muted-foreground">
                                      Total Debits
                                    </Small>
                                    <span className="text-base font-semibold">
                                      {formatCurrency(
                                        walletDetails.totalDebits,
                                      )}
                                    </span>
                                  </div>
                                  <div className="h-8 w-px bg-border" />
                                  <div className="flex flex-col gap-1">
                                    <Small className="text-muted-foreground">
                                      Escrow
                                    </Small>
                                    <span className="text-base font-semibold">
                                      {formatCurrency(
                                        walletDetails.totalEscrow,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Modify Balance */}
                              <div className="flex flex-col gap-2">
                                <H4>Modify Balance</H4>
                                <div className="flex items-center gap-3">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Amount"
                                    value={modifyAmount}
                                    onChange={(e) =>
                                      setModifyAmount(e.target.value)
                                    }
                                    disabled={isModifying}
                                    className="h-8 w-32"
                                  />
                                  <RadioGroup
                                    value={modifyType}
                                    onValueChange={(value) =>
                                      setModifyType(value as "credit" | "debit")
                                    }
                                    disabled={isModifying}
                                    className="flex gap-3"
                                  >
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        value="credit"
                                        id={`credit-${org.orgId}`}
                                      />
                                      <Label htmlFor={`credit-${org.orgId}`}>
                                        Credit
                                      </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        value="debit"
                                        id={`debit-${org.orgId}`}
                                      />
                                      <Label htmlFor={`debit-${org.orgId}`}>
                                        Debit
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                  <Input
                                    placeholder="Reason"
                                    value={modifyReason}
                                    onChange={(e) =>
                                      setModifyReason(e.target.value)
                                    }
                                    disabled={isModifying}
                                    className="h-8 flex-1"
                                  />
                                  <Button
                                    onClick={handleModifyBalance}
                                    disabled={isModifying}
                                    size="sm"
                                  >
                                    {isModifying ? (
                                      <Loader2
                                        size={14}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      "Apply"
                                    )}
                                  </Button>
                                </div>
                                {modifyError && (
                                  <Small className="text-red-600">
                                    {modifyError}
                                  </Small>
                                )}
                                {modifySuccess && (
                                  <Small className="text-green-600">
                                    {modifySuccess}
                                  </Small>
                                )}
                              </div>

                              {/* Settings */}
                              <div className="flex flex-col gap-2">
                                <H4>Wallet Settings</H4>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`allowNeg-${org.orgId}`}
                                      checked={allowNegativeBalance}
                                      onChange={(e) =>
                                        setAllowNegativeBalance(
                                          e.target.checked,
                                        )
                                      }
                                      disabled={isUpdatingSettings}
                                      className="h-4 w-4 cursor-pointer"
                                    />
                                    <Label
                                      htmlFor={`allowNeg-${org.orgId}`}
                                      className="cursor-pointer"
                                    >
                                      Allow Negative Balance
                                    </Label>
                                  </div>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Credit Limit"
                                    value={creditLimit}
                                    onChange={(e) =>
                                      setCreditLimit(e.target.value)
                                    }
                                    disabled={isUpdatingSettings}
                                    className="h-8 w-40"
                                  />
                                  <Button
                                    onClick={handleUpdateSettings}
                                    disabled={isUpdatingSettings}
                                    size="sm"
                                  >
                                    {isUpdatingSettings ? (
                                      <Loader2
                                        size={14}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      "Update Settings"
                                    )}
                                  </Button>
                                </div>
                                {settingsError && (
                                  <Small className="text-red-600">
                                    {settingsError}
                                  </Small>
                                )}
                                {settingsSuccess && (
                                  <Small className="text-green-600">
                                    {settingsSuccess}
                                  </Small>
                                )}
                              </div>

                              {/* Disallow List */}
                              <div className="flex flex-col gap-2">
                                <H4>
                                  Disallow List (
                                  {walletDetails.data?.disallowList?.length ?? 0}
                                  )
                                </H4>
                                {(walletDetails.data?.disallowList?.length ?? 0) >
                                0 ? (
                                  <div className="border">
                                    <table className="w-full text-sm">
                                      <thead className="bg-muted">
                                        <tr>
                                          <th className="p-2 text-left">
                                            Request ID
                                          </th>
                                          <th className="p-2 text-left">
                                            Provider
                                          </th>
                                          <th className="p-2 text-left">
                                            Model
                                          </th>
                                          <th className="w-12 p-2"></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {walletDetails.data?.disallowList?.map(
                                          (entry: any, idx: number) => (
                                            <tr key={idx} className="border-t">
                                              <td className="font-mono p-2 text-xs">
                                                {entry.helicone_request_id.substring(
                                                  0,
                                                  8,
                                                )}
                                                ...
                                              </td>
                                              <td className="p-2">
                                                {entry.provider}
                                              </td>
                                              <td className="p-2">
                                                {entry.model}
                                              </td>
                                              <td className="p-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0"
                                                  onClick={() => {
                                                    setEntryToDelete({
                                                      provider: entry.provider,
                                                      model: entry.model,
                                                    });
                                                    setDeleteDialogOpen(true);
                                                  }}
                                                >
                                                  <Trash2
                                                    size={14}
                                                    className="text-destructive"
                                                  />
                                                </Button>
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="border border-dashed p-4 text-center text-sm text-muted-foreground">
                                    No models are currently disallowed for this
                                    organization.
                                  </div>
                                )}
                              </div>

                              {/* Raw Tables */}
                              <div className="flex flex-col gap-2">
                                <H4>Raw Tables</H4>
                                <div className="flex gap-2">
                                  {[
                                    "credit_purchases",
                                    "aggregated_debits",
                                    "escrows",
                                    "disallow_list",
                                    "processed_webhook_events",
                                  ].map((tableName) => (
                                    <Button
                                      key={tableName}
                                      variant={
                                        selectedTable === tableName
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() =>
                                        handleTableClick(tableName)
                                      }
                                    >
                                      {tableName.split("_")[0]}
                                    </Button>
                                  ))}
                                </div>
                                {selectedTable && (
                                  <div className="border bg-muted/10 p-3">
                                    {tableLoading ? (
                                      <div className="flex items-center justify-center py-4">
                                        <Loader2
                                          size={16}
                                          className="animate-spin"
                                        />
                                      </div>
                                    ) : tableData?.data ? (
                                      <div className="max-h-64 overflow-auto">
                                        <pre className="font-mono whitespace-pre-wrap text-xs">
                                          {JSON.stringify(
                                            tableData.data,
                                            null,
                                            2,
                                          )}
                                        </pre>
                                      </div>
                                    ) : (
                                      <Small className="text-muted-foreground">
                                        No data
                                      </Small>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Failed to load wallet details
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ),
                  ].filter(Boolean);
                })}
                {/* Loading indicator for next page */}
                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-4 text-center">
                      <Loader2
                        size={20}
                        className="inline-block animate-spin text-muted-foreground"
                      />
                    </TableCell>
                  </TableRow>
                )}
                {/* Intersection observer target */}
                <tr ref={observerTarget} style={{ height: "1px" }}>
                  <td colSpan={9} />
                </tr>
              </TableBody>
            </table>
          )}
        </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent
          value="analytics"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-3 data-[state=inactive]:hidden"
        >
          {/* Controls Row with Tabs */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Group By</Label>
                <Select
                  value={groupBy}
                  onValueChange={(value) =>
                    setGroupBy(
                      value as "minute" | "hour" | "day" | "week" | "month",
                    )
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">1 Minute</SelectItem>
                    <SelectItem value="hour">1 Hour</SelectItem>
                    <SelectItem value="day">1 Day</SelectItem>
                    <SelectItem value="week">7 Days</SelectItem>
                    <SelectItem value="month">1 Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ThemedTimeFilterShadCN
                onDateChange={(date) => date && setDateRange(date)}
                initialDateRange={dateRange}
                isLive={false}
              />

              {/* Tabs Navigation */}
              <TabsList className="ml-auto">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Analytics Charts */}
          <WalletAnalyticsCharts
            deposits={timeSeriesData?.deposits || []}
            spend={timeSeriesData?.spend || []}
            isLoading={timeSeriesLoading}
            error={
              timeSeriesError instanceof Error ? timeSeriesError.message : null
            }
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Disallow Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{entryToDelete?.provider}</strong> /{" "}
              <strong>{entryToDelete?.model}</strong> from the disallow list?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDisallowEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

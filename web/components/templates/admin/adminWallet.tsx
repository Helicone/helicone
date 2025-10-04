import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateNetAmount,
  dollarsToCents,
} from "@helicone-package/common/stripe/feeCalculator";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { $JAWN_API } from "@/lib/clients/jawn";
import React, { useRef } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  Loader2,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { formatCurrency as remoteFormatCurrency } from "@/lib/uiUtils";
import { Small, H3, H4 } from "@/components/ui/typography";
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

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return "UNDEFINED";
  return remoteFormatCurrency(amount, "USD", 6);
};

type SortColumn =
  | "org_created_at"
  | "total_payments"
  | "total_spend"
  | "credit_limit"
  | "amount_received";

export default function AdminWallet() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [sortBy, setSortBy] = useState<SortColumn>("org_created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const drawerRef = useRef<ImperativePanelHandle>(null);
  const [drawerSize, setDrawerSize] = useState(50);

  // Delete disallow entry state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{provider: string, model: string} | null>(null);

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

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = $JAWN_API.useQuery("post", "/v1/admin/wallet/gateway/dashboard_data", {
    params: {
      query: {
        search: searchQuery || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
      },
    },
  });

  const dashboardError = dashboardData?.error;

  // Fetch wallet details (lazy loaded when org is selected)
  const {
    data: walletDetails,
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

  const organizations = dashboardData?.data?.organizations || [];

  const handleOrgClick = (orgId: string) => {
    if (selectedOrg === orgId) {
      // Close drawer if clicking same org
      drawerRef.current?.collapse();
      setSelectedOrg(null);
    } else {
      // Open drawer for new org
      setSelectedOrg(orgId);
      drawerRef.current?.expand();
      // Reset table selection when switching orgs
      setSelectedTable(null);
      setTablePage(0);
      // Reset settings form
      setSettingsError(null);
      setSettingsSuccess(null);
      // Load current settings from the org data
      const org = dashboardData?.data?.organizations.find(
        (o) => o.orgId === orgId,
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

  if (dashboardLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
          <p className="text-red-600">Error loading dashboard data</p>
          <p className="text-sm text-muted-foreground">{dashboardError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Organizations with Credits
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.data?.summary?.totalOrgsWithCredits || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Credits Issued
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                dashboardData?.data?.summary?.totalCreditsIssued || 0,
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Credits Spent
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                dashboardData?.data?.summary?.totalCreditsSpent || 0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter with Resizable Table */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Organizations with Pass-Through Billing</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchDashboard()}
              disabled={dashboardLoading}
            >
              <RefreshCw
                size={16}
                className={dashboardLoading ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by org name, ID, owner email, or Stripe customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={dashboardLoading}
              variant="default"
            >
              Search
            </Button>
            {searchQuery && (
              <Button
                onClick={handleClearSearch}
                disabled={dashboardLoading}
                variant="outline"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Organizations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actions</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("org_created_at")}
                  >
                    <div className="flex items-center">
                      Organization
                      <SortIcon column="org_created_at" />
                    </div>
                  </TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead># Payments</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("total_payments")}
                  >
                    <div className="flex items-center">
                      Total Gross
                      <SortIcon column="total_payments" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("amount_received")}
                  >
                    <div className="flex items-center">
                      Total Net
                      <SortIcon column="amount_received" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("total_spend")}
                  >
                    <div className="flex items-center">
                      Total Spent (ClickHouse)
                      <SortIcon column="total_spend" />
                    </div>
                  </TableHead>
                  <TableHead>Calculated Balance</TableHead>
                  <TableHead>Worker Balance State</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("credit_limit")}
                  >
                    <div className="flex items-center">
                      Wallet Settings
                      <SortIcon column="credit_limit" />
                    </div>
                  </TableHead>
                  <TableHead>Last Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations?.map((org) => {
                  // Calculate net amount after removing Stripe fees
                  const totalGrossCents = dollarsToCents(org.totalPayments);
                  const totalNetCents = calculateNetAmount(
                    totalGrossCents,
                    org.paymentsCount || 0,
                  );
                  const totalNetDollars = totalNetCents / 100;

                  const balance = totalNetDollars - org.clickhouseTotalSpend;
                  const isNegativeBalance = balance < 0;

                  return (
                      <TableRow
                        key={org.orgId}
                        className={`cursor-pointer hover:bg-muted/50 ${selectedOrg === org.orgId ? 'bg-muted' : ''}`}
                        onClick={() => handleOrgClick(org.orgId)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            {org.stripeCustomerId && (
                              <Button
                                size="sm"
                                variant="outline"
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{org.orgName}</div>
                            <div className="text-sm text-muted-foreground">
                              {org.orgId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {org.ownerEmail}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            {org.tier}
                          </span>
                        </TableCell>
                        <TableCell>{org.paymentsCount || 0}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatCurrency(org.totalPayments)}</span>
                            <span className="text-xs text-muted-foreground">
                              (with fees)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatCurrency(totalNetDollars)}</span>
                            <span className="text-xs text-muted-foreground">
                              (after fees)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(org.clickhouseTotalSpend)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              isNegativeBalance
                                ? "font-medium text-red-600"
                                : ""
                            }
                          >
                            {formatCurrency(balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {org.walletBalance !== undefined ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <Small className="text-muted-foreground">
                                  Balance:
                                </Small>
                                <span
                                  className={
                                    org.walletBalance < 0
                                      ? "text-sm font-medium text-red-600"
                                      : "text-sm"
                                  }
                                >
                                  {formatCurrency(org.walletBalance)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Small className="text-muted-foreground">
                                  Disallowed:
                                </Small>
                                <span className="text-sm">
                                  {org.walletDisallowedModelCount ?? 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Small className="text-muted-foreground">
                                  Stripe Events:
                                </Small>
                                <span className="text-sm">
                                  {org.walletProcessedEventsCount ?? 0}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <Small className="text-muted-foreground">
                              N/A
                            </Small>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Small className="text-muted-foreground">
                              Limit: {formatCurrency(org.creditLimit || 0)}
                            </Small>
                            <Small
                              className={
                                org.allowNegativeBalance
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Negative:{" "}
                              {org.allowNegativeBalance ? "Yes" : "No"}
                            </Small>
                          </div>
                        </TableCell>
                        <TableCell>
                          {org.lastPaymentDate
                            ? new Date(org.lastPaymentDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </ResizablePanel>

        <ResizableHandle />

        {/* Wallet Details Drawer */}
        <ResizablePanel
          ref={drawerRef}
          defaultSize={0}
          minSize={33}
          onResize={(size) => {
            if (size > 0) {
              setDrawerSize(size);
            }
          }}
          onExpand={() => {
            drawerRef.current?.resize(drawerSize);
          }}
          collapsible={true}
        >
          <div className="h-full overflow-y-auto bg-background border-l p-4">
            {walletLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : walletDetails ? (
              <div className="flex flex-col gap-4">
                {/* Close Button */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <H3 className="text-foreground">Wallet Details</H3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      drawerRef.current?.collapse();
                      setSelectedOrg(null);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </div>

                {/* Overview Section */}
                <section className="flex flex-col gap-2">
                  <H4 className="text-sm font-semibold">Overview</H4>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-card border shadow-sm p-3 hover:shadow-md transition-shadow">
                      <div className="text-xs text-muted-foreground mb-1">Balance</div>
                      <div className="text-base font-bold">
                        {formatCurrency(walletDetails?.data?.balance)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-card border shadow-sm p-3 hover:shadow-md transition-shadow">
                      <div className="text-xs text-muted-foreground mb-1">Effective Balance</div>
                      <div className="text-base font-bold">
                        {formatCurrency(walletDetails?.data?.effectiveBalance)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-card border shadow-sm p-3 hover:shadow-md transition-shadow">
                      <div className="text-xs text-muted-foreground mb-1">Total Credits</div>
                      <div className="text-base font-bold">
                        {formatCurrency(walletDetails?.data?.totalCredits)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-card border shadow-sm p-3 hover:shadow-md transition-shadow">
                      <div className="text-xs text-muted-foreground mb-1">Total Debits</div>
                      <div className="text-base font-bold">
                        {formatCurrency(walletDetails.data?.totalDebits)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Modify Balance */}
                <section className="flex flex-col gap-2">
                  <H4 className="text-sm font-semibold">Modify Balance</H4>
                  <div className="rounded-lg bg-card border shadow-sm p-3 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        value={modifyAmount}
                        onChange={(e) => setModifyAmount(e.target.value)}
                        disabled={isModifying}
                        className="h-8 text-sm"
                      />
                      <RadioGroup
                        value={modifyType}
                        onValueChange={(value) =>
                          setModifyType(value as "credit" | "debit")
                        }
                        disabled={isModifying}
                        className="flex gap-2"
                      >
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="credit" id="credit" className="h-3 w-3" />
                          <Label htmlFor="credit" className="text-xs">Credit</Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="debit" id="debit" className="h-3 w-3" />
                          <Label htmlFor="debit" className="text-xs">Debit</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Textarea
                      placeholder="Reason"
                      value={modifyReason}
                      onChange={(e) => setModifyReason(e.target.value)}
                      disabled={isModifying}
                      rows={2}
                      className="text-xs"
                    />
                    {modifyError && (
                      <div className="rounded border border-red-200 bg-red-50 p-1.5 text-xs text-red-600">
                        {modifyError}
                      </div>
                    )}
                    {modifySuccess && (
                      <div className="rounded border border-green-200 bg-green-50 p-1.5 text-xs text-green-600">
                        {modifySuccess}
                      </div>
                    )}
                    <Button
                      onClick={handleModifyBalance}
                      disabled={isModifying}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      {isModifying ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `${modifyType === "credit" ? "Add" : "Deduct"}`
                      )}
                    </Button>
                  </div>
                </section>

                {/* Wallet Settings */}
                <section className="flex flex-col gap-2">
                  <H4 className="text-sm font-semibold">Wallet Settings</H4>
                  <div className="rounded-lg bg-card border shadow-sm p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded bg-muted/50 p-1.5">
                      <input
                        type="checkbox"
                        id="allowNeg"
                        checked={allowNegativeBalance}
                        onChange={(e) =>
                          setAllowNegativeBalance(e.target.checked)
                        }
                        disabled={isUpdatingSettings}
                        className="h-3 w-3 cursor-pointer rounded"
                      />
                      <Label
                        htmlFor="allowNeg"
                        className="cursor-pointer text-xs"
                      >
                        Allow Negative Balance
                      </Label>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs whitespace-nowrap">Limit:</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        disabled={isUpdatingSettings}
                        className="h-8 text-sm"
                      />
                    </div>
                    {settingsError && (
                      <div className="rounded border border-red-200 bg-red-50 p-1.5 text-xs text-red-600">
                        {settingsError}
                      </div>
                    )}
                    {settingsSuccess && (
                      <div className="rounded border border-green-200 bg-green-50 p-1.5 text-xs text-green-600">
                        {settingsSuccess}
                      </div>
                    )}
                    <Button
                      onClick={handleUpdateSettings}
                      disabled={isUpdatingSettings}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      {isUpdatingSettings ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update"
                      )}
                    </Button>
                  </div>
                </section>

                {/* Escrows */}
                <section className="flex flex-col gap-2">
                  <H4 className="text-sm font-semibold">Escrows</H4>
                  <div className="rounded-lg bg-card border shadow-sm p-3 hover:shadow-md transition-shadow">
                    <div className="text-base font-bold">
                      {formatCurrency(walletDetails.data?.totalEscrow)}
                    </div>
                  </div>
                </section>

                {/* Disallow List */}
                <section className="flex flex-col gap-2">
                  <H4 className="text-sm font-semibold">Disallow List ({walletDetails?.data?.disallowList?.length ?? 0})</H4>
                  <div className="rounded-lg bg-card border shadow-sm overflow-hidden">
                    {(walletDetails?.data?.disallowList?.length ?? 0) > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Request ID</TableHead>
                            <TableHead className="text-xs">Provider</TableHead>
                            <TableHead className="text-xs">Model</TableHead>
                            <TableHead className="text-xs w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {walletDetails?.data?.disallowList?.map((entry, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs font-mono">
                                {entry.helicone_request_id.substring(0, 8)}...
                              </TableCell>
                              <TableCell className="text-xs">{entry.provider}</TableCell>
                              <TableCell className="text-xs">{entry.model}</TableCell>
                              <TableCell className="text-xs">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    setEntryToDelete({
                                      provider: entry.provider,
                                      model: entry.model,
                                    });
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 size={14} className="text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground text-center">None</div>
                    )}
                  </div>
                </section>

                {/* Raw Tables */}
                <section className="flex flex-col gap-2">
                  <H4 className="text-sm font-semibold">Raw Tables</H4>
                  <div className="rounded-lg bg-card border shadow-sm p-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        "credit_purchases",
                        "aggregated_debits",
                        "escrows",
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
                          onClick={() => handleTableClick(tableName)}
                          className="h-7 text-xs px-3"
                        >
                          {tableName.split("_")[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Table Data Display */}
                {selectedTable && (
                  <section className="flex flex-col gap-2">
                    <H4 className="text-sm font-semibold">Table: {selectedTable}</H4>
                    <div className="rounded-lg bg-card border shadow-sm p-3">
                      {tableLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 size={16} className="animate-spin" />
                        </div>
                      ) : tableData?.data?.data ? (
                        <div className="overflow-auto max-h-48 rounded bg-muted/30 p-2">
                          <pre className="text-xs font-mono">
                            {JSON.stringify(tableData.data, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No data</div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            ) : selectedOrg ? (
              <p className="text-xs text-muted-foreground">Failed to load</p>
            ) : null}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Disallow Entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove <strong>{entryToDelete?.provider}</strong> / <strong>{entryToDelete?.model}</strong> from the disallow list? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteDisallowEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

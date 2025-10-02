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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { $JAWN_API } from "@/lib/clients/jawn";
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
} from "lucide-react";
import { formatCurrency as remoteFormatCurrency } from "@/lib/uiUtils";
import { Small } from "@/components/ui/typography";

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
  const [walletDetailsOpen, setWalletDetailsOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [sortBy, setSortBy] = useState<SortColumn>("org_created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
      enabled: !!selectedOrg && walletDetailsOpen,
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
      enabled: !!selectedOrg && !!selectedTable && walletDetailsOpen,
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
    setSelectedOrg(orgId);
    setWalletDetailsOpen(true);
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
    <div className="space-y-6">
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

      {/* Search and Filter */}
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
                  <TableHead>Balance</TableHead>
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
                  <TableHead>Actions</TableHead>
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
                    <>
                      <TableRow key={org.orgId}>
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
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOrgClick(org.orgId)}
                            >
                              View Details
                            </Button>
                            {org.stripeCustomerId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const stripeUrl = dashboardData?.data
                                    ?.isProduction
                                    ? `https://dashboard.stripe.com/customers/${org.stripeCustomerId}`
                                    : `https://dashboard.stripe.com/test/customers/${org.stripeCustomerId}`;
                                  window.open(stripeUrl, "_blank");
                                }}
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Stripe
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Details Dialog */}
      <Dialog open={walletDetailsOpen} onOpenChange={setWalletDetailsOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wallet Details - {selectedOrg}</DialogTitle>
          </DialogHeader>

          {walletLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : walletDetails ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="modify">Modify Balance</TabsTrigger>
                <TabsTrigger value="settings">Credit Limit</TabsTrigger>
                <TabsTrigger value="escrows">Escrows</TabsTrigger>
                <TabsTrigger value="disallow">Disallow List</TabsTrigger>
                <TabsTrigger value="tables">Raw Tables</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(walletDetails?.data?.balance)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Effective Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(walletDetails?.data?.effectiveBalance)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Credits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(walletDetails?.data?.totalCredits)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Debits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(walletDetails.data?.totalDebits)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="modify" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Modify Wallet Balance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Amount Input */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (USD)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="10.00"
                        value={modifyAmount}
                        onChange={(e) => setModifyAmount(e.target.value)}
                        disabled={isModifying}
                      />
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <RadioGroup
                        value={modifyType}
                        onValueChange={(value) =>
                          setModifyType(value as "credit" | "debit")
                        }
                        disabled={isModifying}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="credit" id="credit" />
                          <Label htmlFor="credit" className="font-normal">
                            Add Credits (Credit)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="debit" id="debit" />
                          <Label htmlFor="debit" className="font-normal">
                            Deduct Credits (Debit)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason (for audit trail)</Label>
                      <Textarea
                        id="reason"
                        placeholder="e.g., Manual credit adjustment for promotional offer"
                        value={modifyReason}
                        onChange={(e) => setModifyReason(e.target.value)}
                        disabled={isModifying}
                        rows={3}
                      />
                    </div>

                    {/* Error/Success Messages */}
                    {modifyError && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle className="mr-2 inline h-4 w-4" />
                        {modifyError}
                      </div>
                    )}
                    {modifySuccess && (
                      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                        {modifySuccess}
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      onClick={handleModifyBalance}
                      disabled={isModifying}
                      className="w-full"
                    >
                      {isModifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `${modifyType === "credit" ? "Add" : "Deduct"} Credits`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Wallet Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    {/* Allow Negative Balance Toggle */}
                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="allowNegativeBalance"
                          checked={allowNegativeBalance}
                          onChange={(e) =>
                            setAllowNegativeBalance(e.target.checked)
                          }
                          disabled={isUpdatingSettings}
                          className="h-6 w-6 cursor-pointer rounded border-2 border-border accent-primary"
                        />
                        <Label
                          htmlFor="allowNegativeBalance"
                          className="cursor-pointer text-base font-medium"
                        >
                          Allow Negative Balance
                        </Label>
                      </div>
                      <Small className="text-muted-foreground">
                        When enabled, the organization can spend beyond their
                        credit limit
                      </Small>
                    </div>

                    {/* Credit Limit Input */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="creditLimit" className="text-base">
                        Credit Limit
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="creditLimit"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={creditLimit}
                          onChange={(e) => setCreditLimit(e.target.value)}
                          disabled={isUpdatingSettings}
                          className="pl-7"
                        />
                      </div>
                      <Small className="text-muted-foreground">
                        Maximum amount the organization can spend. Set to 0 for
                        unlimited.
                      </Small>
                    </div>

                    {/* Error/Success Messages */}
                    {settingsError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{settingsError}</span>
                      </div>
                    )}
                    {settingsSuccess && (
                      <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                        <span>{settingsSuccess}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      onClick={handleUpdateSettings}
                      disabled={isUpdatingSettings}
                    >
                      {isUpdatingSettings ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Settings"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="escrows">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Escrow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(walletDetails.data?.totalEscrow)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="disallow">
                <Card>
                  <CardHeader>
                    <CardTitle>Disallow List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(walletDetails?.data?.disallowList?.length ?? 0) > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Request ID</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Model</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {walletDetails?.data?.disallowList?.map(
                            (entry, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-sm">
                                  {entry.helicone_request_id}
                                </TableCell>
                                <TableCell>{entry.provider}</TableCell>
                                <TableCell>{entry.model}</TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground">
                        No entries in disallow list
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tables">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Raw Table Inspection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground">
                        Select a table to inspect raw data from the wallet
                        durable object:
                      </p>
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
                          >
                            {tableName}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedTable && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Table: {selectedTable}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tableLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading table data...</span>
                          </div>
                        ) : tableData ? (
                          <div>
                            {/* DEBUG: Show raw tableData structure */}
                            <details className="mb-4 rounded border border-slate-200 bg-slate-50 p-3">
                              <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800">
                                🔍 Debug: Raw API Response
                              </summary>
                              <pre className="mt-2 max-h-48 overflow-auto rounded border bg-white p-3 text-xs text-slate-700">
                                {JSON.stringify(tableData, null, 2)}
                              </pre>
                            </details>

                            {tableData?.data?.data?.message ? (
                              <div className="py-8 text-center">
                                <p className="text-muted-foreground">
                                  {tableData?.data?.data?.message}
                                </p>
                              </div>
                            ) : tableData?.data?.data ? (
                              <div>
                                <div className="mb-4 text-sm text-muted-foreground">
                                  Total records: {tableData.data?.data?.total} |
                                  Page: {tableData.data?.data?.page + 1} | Page
                                  size: {tableData.data?.pageSize}
                                </div>
                                {tableData.data.data.data.length > 0 ? (
                                  <div className="overflow-hidden rounded-lg border">
                                    <pre className="max-h-96 overflow-auto bg-muted p-4 text-xs">
                                      {JSON.stringify(tableData.data, null, 2)}
                                    </pre>
                                  </div>
                                ) : (
                                  <div className="py-8 text-center">
                                    <p className="text-muted-foreground">
                                      No data found in this table
                                    </p>
                                  </div>
                                )}
                                {tableData.data.data.total >
                                  tableData.data.pageSize && (
                                  <div className="mt-4 flex justify-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setTablePage(Math.max(0, tablePage - 1))
                                      }
                                      disabled={tablePage === 0}
                                    >
                                      Previous
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setTablePage(tablePage + 1)
                                      }
                                      disabled={
                                        (tablePage + 1) *
                                          tableData.data.pageSize >=
                                        tableData.data.data.total
                                      }
                                    >
                                      Next
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>No</div>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <p className="text-muted-foreground">
                              Failed to load table data
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <p>Failed to load wallet details</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

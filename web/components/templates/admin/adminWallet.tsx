import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useJawnClient } from "@/lib/clients/jawnHook";
import {
  Loader2,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { formatCurrency as remoteFormatCurrency } from "@/lib/uiUtils";

const formatCurrency = (amount: number) => {
  return remoteFormatCurrency(amount, "USD", 6);
}

interface DashboardData {
  organizations: Array<{
    orgId: string;
    orgName: string;
    stripeCustomerId: string;
    totalPayments: number;
    clickhouseTotalSpend: number;
    lastPaymentDate: string;
    tier: string;
    ownerEmail: string;
  }>;
  summary: {
    totalOrgsWithCredits: number;
    totalCreditsIssued: number;
    totalCreditsSpent: number;
  };
  isProduction: boolean;
}

interface WalletState {
  balance: number;
  effectiveBalance: number;
  totalEscrow: number;
  totalDebits: number;
  totalCredits: number;
  disallowList: Array<{
    helicone_request_id: string;
    provider: string;
    model: string;
  }>;
}

interface TableData {
  tableName: string;
  orgId: string;
  page: number;
  pageSize: number;
  data: any[];
  total: number;
  message?: string;
}

export default function AdminWallet() {
  const jawn = useJawnClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [walletDetailsOpen, setWalletDetailsOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(0);

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<DashboardData>({
    queryKey: ["admin-wallet-dashboard"],
    queryFn: async () => {
      console.log("Fetching dashboard data...");
      const response = await jawn.POST("/v1/admin/gateway/dashboard_data", {}) as any;
      console.log("Dashboard API response:", response);
      console.log("Response data:", response.data);
      console.log("Response error:", response.error);
      console.log("Response data type:", typeof response.data);
      console.log(
        "Response data keys:",
        response.data ? Object.keys(response.data) : "No data",
      );
      if (response.error || !response.data) {
        throw new Error(
          `Failed to fetch dashboard data: ${response.error || "No data"}`,
        );
      }
      // The jawn client returns {data: actualData, error: null}, so we need response.data.data
      const actualData = response.data.data || response.data;
      console.log("Actual dashboard data:", actualData);
      return actualData as DashboardData;
    },
  });

  // Fetch wallet details (lazy loaded when org is selected)
  const { data: walletDetails, isLoading: walletLoading } =
    useQuery<WalletState>({
      queryKey: ["admin-wallet-details", selectedOrg],
      queryFn: async () => {
        if (!selectedOrg) throw new Error("No org selected");
        console.log("Fetching wallet details for org:", selectedOrg);
        const response = await (jawn as any).POST(`/v1/admin/wallet/${selectedOrg}`, {});
        console.log("Wallet details API response:", response);
        console.log("Wallet response data:", response.data);
        console.log("Wallet response error:", response.error);
        if (response.error || !response.data) {
          throw new Error(
            `Failed to fetch wallet details: ${response.error || "No data"}`,
          );
        }
        // Handle nested data structure like dashboard endpoint
        const actualWalletData = (response.data as any).data || response.data;
        console.log("Actual wallet data:", actualWalletData);
        return actualWalletData as WalletState;
      },
      enabled: !!selectedOrg && walletDetailsOpen,
    });

  // Fetch table data (lazy loaded when table is selected)
  const { data: tableData, isLoading: tableLoading } = useQuery<TableData>({
    queryKey: ["admin-wallet-table", selectedOrg, selectedTable, tablePage],
    queryFn: async () => {
      if (!selectedOrg || !selectedTable)
        throw new Error("No org or table selected");
      console.log(
        "Fetching table data for org:",
        selectedOrg,
        "table:",
        selectedTable,
      );
      const response = await (jawn as any).POST(
        `/v1/admin/wallet/${selectedOrg}/tables/${selectedTable}?page=${tablePage}&pageSize=50`,
        {},
      );
      console.log("Table data API response:", response);
      if (response.error || !response.data) {
        throw new Error(
          `Failed to fetch table data: ${response.error || "No data"}`,
        );
      }
      const actualTableData = (response.data as any).data || response.data;
      console.log("Actual table data:", actualTableData);
      return actualTableData as TableData;
    },
    enabled: !!selectedOrg && !!selectedTable && walletDetailsOpen,
  });

  const filteredOrgs =
    dashboardData?.organizations?.filter(
      (org) =>
        org.orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.orgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.stripeCustomerId
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        org.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const handleOrgClick = (orgId: string) => {
    setSelectedOrg(orgId);
    setWalletDetailsOpen(true);
    // Reset table selection when switching orgs
    setSelectedTable(null);
    setTablePage(0);
  };

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    setTablePage(0); // Reset to first page when switching tables
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
          <p className="text-sm text-muted-foreground">
            {dashboardError.message}
          </p>
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
              {dashboardData?.summary?.totalOrgsWithCredits || 0}
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
              {formatCurrency(dashboardData?.summary?.totalCreditsIssued || 0)}
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
              {formatCurrency(dashboardData?.summary?.totalCreditsSpent || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations with Pass-Through Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by org name, ID, owner email, or Stripe customer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Organizations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Total Payments</TableHead>
                  <TableHead>Total Spent (ClickHouse)</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs?.map((org) => {
                  const balance = org.totalPayments - org.clickhouseTotalSpend;
                  const isNegativeBalance = balance < 0;

                  return (
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
                      <TableCell>{formatCurrency(org.totalPayments)}</TableCell>
                      <TableCell>
                        {formatCurrency(org.clickhouseTotalSpend)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            isNegativeBalance ? "font-medium text-red-600" : ""
                          }
                        >
                          {formatCurrency(balance)}
                        </span>
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
                                const stripeUrl = dashboardData?.isProduction
                                  ? `https://dashboard.stripe.com/customers/${org.stripeCustomerId}`
                                  : `https://dashboard.stripe.com/test/customers/${org.stripeCustomerId}`;
                                window.open(stripeUrl, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Stripe
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
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
                        {formatCurrency(walletDetails.balance)}
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
                        {formatCurrency(walletDetails.effectiveBalance)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Credits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(walletDetails.totalCredits)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Debits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(walletDetails.totalDebits)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="escrows">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Escrow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(walletDetails.totalEscrow)}
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
                    {walletDetails?.disallowList?.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Request ID</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Model</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {walletDetails?.disallowList?.map((entry, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-sm">
                                {entry.helicone_request_id}
                              </TableCell>
                              <TableCell>{entry.provider}</TableCell>
                              <TableCell>{entry.model}</TableCell>
                            </TableRow>
                          ))}
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
                            {tableData.message ? (
                              <div className="py-8 text-center">
                                <p className="text-muted-foreground">
                                  {tableData.message}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <div className="mb-4 text-sm text-muted-foreground">
                                  Total records: {tableData.total} | Page:{" "}
                                  {tableData.page + 1} | Page size:{" "}
                                  {tableData.pageSize}
                                </div>
                                {tableData.data.length > 0 ? (
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
                                {tableData.total > tableData.pageSize && (
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
                                        (tablePage + 1) * tableData.pageSize >=
                                        tableData.total
                                      }
                                    >
                                      Next
                                    </Button>
                                  </div>
                                )}
                              </div>
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

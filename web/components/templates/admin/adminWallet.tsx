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
import { Loader2, Search, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  organizations: Array<{
    orgId: string;
    orgName: string;
    stripeCustomerId: string;
    totalPayments: number;
    clickhouseTotalSpend: number;
    lastPaymentDate: string;
    tier: string;
  }>;
  summary: {
    totalOrgsWithCredits: number;
    totalCreditsIssued: number;
    totalCreditsSpent: number;
  };
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

export default function AdminWallet() {
  const jawn = useJawnClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [walletDetailsOpen, setWalletDetailsOpen] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ["admin-wallet-dashboard"],
    queryFn: async () => {
      console.log("Fetching dashboard data...");
      const response = await jawn.POST("/v1/admin/gateway/dashboard_data");
      console.log("Dashboard API response:", response);
      console.log("Response data:", response.data);
      console.log("Response error:", response.error);
      console.log("Response data type:", typeof response.data);
      console.log("Response data keys:", response.data ? Object.keys(response.data) : "No data");
      if (response.error || !response.data) {
        throw new Error(`Failed to fetch dashboard data: ${response.error || "No data"}`);
      }
      // The jawn client returns {data: actualData, error: null}, so we need response.data.data
      const actualData = response.data.data || response.data;
      console.log("Actual dashboard data:", actualData);
      return actualData as DashboardData;
    },
  });

  // Fetch wallet details (lazy loaded when org is selected)
  const { data: walletDetails, isLoading: walletLoading } = useQuery<WalletState>({
    queryKey: ["admin-wallet-details", selectedOrg],
    queryFn: async () => {
      if (!selectedOrg) throw new Error("No org selected");
      const response = await jawn.POST(`/v1/admin/wallet/${selectedOrg}`);
      if (response.error || !response.data) {
        throw new Error("Failed to fetch wallet details");
      }
      return response.data as WalletState;
    },
    enabled: !!selectedOrg && walletDetailsOpen,
  });

  const filteredOrgs = dashboardData?.organizations?.filter(
    (org) =>
      org.orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.orgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.stripeCustomerId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleOrgClick = (orgId: string) => {
    setSelectedOrg(orgId);
    setWalletDetailsOpen(true);
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Error loading dashboard data</p>
          <p className="text-sm text-muted-foreground">{dashboardError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by org name, ID, or Stripe customer ID..."
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
                  <TableHead>Tier</TableHead>
                  <TableHead>Total Payments</TableHead>
                  <TableHead>Total Spent (ClickHouse)</TableHead>
                  <TableHead>Discrepancy</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs?.map((org) => {
                  const discrepancy = org.totalPayments - org.clickhouseTotalSpend;
                  const hasDiscrepancy = Math.abs(discrepancy) > 0.1;
                  
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
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {org.tier}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(org.totalPayments)}</TableCell>
                      <TableCell>{formatCurrency(org.clickhouseTotalSpend)}</TableCell>
                      <TableCell>
                        <span className={hasDiscrepancy ? "text-red-600 font-medium" : ""}>
                          {formatCurrency(discrepancy)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {org.lastPaymentDate
                          ? new Date(org.lastPaymentDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOrgClick(org.orgId)}
                        >
                          View Details
                        </Button>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Wallet Details - {selectedOrg}
            </DialogTitle>
          </DialogHeader>
          
          {walletLoading ? (
            <div className="flex items-center justify-center h-64">
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
                      <CardTitle className="text-sm">Effective Balance</CardTitle>
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
                      <p className="text-muted-foreground">No entries in disallow list</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tables">
                <Card>
                  <CardHeader>
                    <CardTitle>Raw Table Inspection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Select a table to inspect raw data from the wallet durable object:
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        credit_purchases
                      </Button>
                      <Button variant="outline" size="sm">
                        aggregated_debits
                      </Button>
                      <Button variant="outline" size="sm">
                        escrows
                      </Button>
                      <Button variant="outline" size="sm">
                        processed_webhook_events
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
import Header from "@/components/shared/Header";
import { AutoTopoffModal } from "@/components/templates/settings/AutoTopoffModal";
import { LastTopoffDetailsModal } from "@/components/templates/settings/LastTopoffDetailsModal";
import PaymentModal from "@/components/templates/settings/PaymentModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Muted, Small, XSmall } from "@/components/ui/typography";
import { useAutoTopoffSettings } from "@/services/hooks/useAutoTopoff";
import {
  useCredits,
  useCreditTransactions,
  useDiscounts,
  useInvoices,
  useSpendBreakdown,
  type ModelSpend,
  type PurchasedCredits,
} from "@/services/hooks/useCredits";
import { formatDate } from "@/utils/date";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  RefreshCcw,
  Settings,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import { ReactElement, useEffect, useMemo, useState } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import { NextPageWithLayout } from "./_app";

type SortField =
  | "total"
  | "model"
  | "provider"
  | "inputTokens"
  | "outputTokens"
  | "cacheReadTokens"
  | "cacheWriteTokens";
type SortDirection = "asc" | "desc";

const Credits: NextPageWithLayout<void> = () => {
  // Overview tab state
  const [currentPageToken, setCurrentPageToken] = useState<string | null>(null);
  const [pageTokenHistory, setPageTokenHistory] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAutoTopoffModalOpen, setIsAutoTopoffModalOpen] = useState(false);
  const [isLastTopoffModalOpen, setIsLastTopoffModalOpen] = useState(false);

  // Usage tab state
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [sortField, setSortField] = useState<SortField>("total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const router = useRouter();

  // Tab state synced with URL
  const currentTab = (router.query.tab as string) || "overview";
  const setCurrentTab = (tab: string) => {
    router.replace({ query: { ...router.query, tab } }, undefined, {
      shallow: true,
    });
  };

  // Data hooks
  const {
    data: creditData,
    isLoading,
    error: creditError,
    refetch,
  } = useCredits();
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
    error: transactionsError,
  } = useCreditTransactions({
    limit: pageSize,
    page: currentPageToken,
  });
  const { data: autoTopoffSettings } = useAutoTopoffSettings();

  const {
    data: breakdownData,
    isLoading: breakdownLoading,
    error: breakdownError,
    refetch: refetchBreakdown,
  } = useSpendBreakdown({ startDate, endDate });

  const {
    data: invoices,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices();

  // Fetch discount rules
  const { data: discounts, isLoading: discountsLoading } = useDiscounts();

  // Auto-open auto top-up modal when returning from Stripe setup
  useEffect(() => {
    if (router.query.setup === "success") {
      setIsAutoTopoffModalOpen(true);
    }
  }, [router, router.query.setup]);

  const transactions = transactionsData?.purchases || [];
  const hasMore = transactionsData?.hasMore || false;
  const hasPrevious = pageTokenHistory.length > 0;
  const currentPageNumber = pageTokenHistory.length + 1;

  // Sorting for breakdown table
  const sortedModels = useMemo(() => {
    if (!breakdownData?.models) return [];
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return [...breakdownData.models].sort((a, b) => {
      switch (sortField) {
        case "total":
          return (a.total - b.total) * multiplier;
        case "model":
          return a.model.localeCompare(b.model) * multiplier;
        case "provider":
          return a.provider.localeCompare(b.provider) * multiplier;
        case "inputTokens":
          return (a.promptTokens - b.promptTokens) * multiplier;
        case "outputTokens":
          return (a.completionTokens - b.completionTokens) * multiplier;
        case "cacheReadTokens":
          return (a.cacheReadTokens - b.cacheReadTokens) * multiplier;
        case "cacheWriteTokens":
          return (a.cacheWriteTokens - b.cacheWriteTokens) * multiplier;
        default:
          return 0;
      }
    });
  }, [breakdownData?.models, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toLocaleString();
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "-";
    if (price < 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return "$0.00";
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    if (cost < 1) return `$${cost.toFixed(4)}`;
    return cost.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const SortableHeader = ({
    field,
    children,
    align = "left",
  }: {
    field: SortField;
    children: React.ReactNode;
    align?: "left" | "right";
  }) => (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1 hover:text-foreground ${
          align === "right" ? "ml-auto" : ""
        }`}
      >
        {children}
        <ArrowUpDown
          size={14}
          className={sortField === field ? "text-foreground" : "opacity-50"}
        />
      </button>
    </TableHead>
  );

  return (
    <div className="flex h-screen w-full flex-col">
      <Header
        title="Credits"
        rightActions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                refetch();
                refetchTransactions();
                refetchBreakdown();
                refetchInvoices();
              }}
              disabled={isLoading || transactionsLoading || breakdownLoading}
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading || transactionsLoading || breakdownLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 justify-center">
        <div className="flex w-full max-w-7xl flex-col">
          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="px-6 pt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                {invoices.length > 0 && (
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                )}
                {discounts.length > 0 && (
                  <TabsTrigger value="discounts">Discounts</TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent
              value="overview"
              className="mt-0 overflow-auto p-6 data-[state=inactive]:hidden"
            >
              <div className="flex flex-col gap-6">
                {/* Current Balance Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Wallet size={20} className="text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">
                        Current Balance
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-3xl font-bold">
                      {isLoading ? (
                        <span className="text-muted-foreground">
                          Loading...
                        </span>
                      ) : creditError ? (
                        <span className="text-destructive">
                          Error loading balance
                        </span>
                      ) : (
                        `$${(() => {
                          const balance = creditData?.balance ?? 0;
                          if (balance % 1 === 0) return balance.toFixed(2);
                          if (balance >= 100) return balance.toFixed(5);
                          if (balance >= 10) return balance.toFixed(4);
                          return balance.toFixed(6);
                        })()}`
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Buy Credits and Auto Top-Up Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CreditCard
                          size={20}
                          className="text-muted-foreground"
                        />
                        <CardTitle className="text-base">Buy Credits</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => setIsPaymentModalOpen(true)}
                      >
                        Add Credits
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={20} className="text-muted-foreground" />
                          <CardTitle className="text-base">
                            Auto Top-Up
                          </CardTitle>
                        </div>
                        {autoTopoffSettings && (
                          <Badge
                            variant={
                              autoTopoffSettings.enabled
                                ? "default"
                                : "secondary"
                            }
                          >
                            {autoTopoffSettings.enabled ? "Active" : "Inactive"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <Muted className="text-xs">
                        Automatically purchase credits when your balance falls
                        below a threshold.
                      </Muted>
                      {autoTopoffSettings?.enabled && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Wallet
                              size={14}
                              className="text-muted-foreground"
                            />
                            <span>
                              Triggers at $
                              {(
                                autoTopoffSettings.thresholdCents / 100
                              ).toFixed(0)}{" "}
                              • Tops up $
                              {(
                                autoTopoffSettings.topoffAmountCents / 100
                              ).toFixed(0)}
                            </span>
                          </div>
                          {autoTopoffSettings.lastTopoffAt && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock size={14} />
                              <span>
                                Last top-off:{" "}
                                <span
                                  onClick={() => setIsLastTopoffModalOpen(true)}
                                  className="cursor-pointer underline hover:text-foreground"
                                >
                                  {formatDate(autoTopoffSettings.lastTopoffAt)}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setIsAutoTopoffModalOpen(true)}
                      >
                        <Settings size={16} className="mr-2" />
                        Configure Auto Top-Up
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Recent Transactions
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Page size
                        </span>
                        <Select
                          value={pageSize.toString()}
                          onValueChange={(value) => {
                            setPageSize(Number(value));
                            setCurrentPageToken(null);
                            setPageTokenHistory([]);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[60px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <div className="py-8 text-center">
                        <Muted>Loading transactions...</Muted>
                      </div>
                    ) : transactionsError ? (
                      <div className="py-8 text-center">
                        <Muted>Error loading transactions</Muted>
                      </div>
                    ) : transactions.length > 0 ? (
                      <>
                        <div className="space-y-0">
                          {transactions.map(
                            (transaction: PurchasedCredits, index: number) => {
                              const amount = transaction.credits || 0;
                              const created = new Date(transaction.createdAt);
                              const createdStr = created.toISOString();
                              const status = transaction.status;

                              const getStatusDisplay = () => {
                                if (status === "refunded") {
                                  return {
                                    label: "Refunded",
                                    icon: AlertCircle,
                                    className:
                                      "text-amber-600 dark:text-amber-500",
                                    showAmount: true,
                                    showNetAmount: false,
                                  };
                                }
                                if (
                                  transaction.isRefunded &&
                                  transaction.refundedAmount &&
                                  transaction.refundedAmount > 0
                                ) {
                                  return {
                                    label: "Partially refunded",
                                    icon: AlertCircle,
                                    className:
                                      "text-amber-600 dark:text-amber-500",
                                    showAmount: true,
                                    showNetAmount: true,
                                  };
                                }
                                switch (status) {
                                  case "succeeded":
                                    return {
                                      label: "Completed",
                                      icon: CheckCircle,
                                      className:
                                        "text-green-600 dark:text-green-500",
                                      showAmount: true,
                                      showNetAmount: false,
                                    };
                                  case "processing":
                                    return {
                                      label: "Processing",
                                      icon: Clock,
                                      className:
                                        "text-blue-600 dark:text-blue-500",
                                      showAmount: true,
                                      showNetAmount: false,
                                    };
                                  case "canceled":
                                    return {
                                      label: "Canceled",
                                      icon: XCircle,
                                      className: "text-muted-foreground",
                                      showAmount: false,
                                      showNetAmount: false,
                                    };
                                  case "requires_action":
                                  case "requires_capture":
                                  case "requires_confirmation":
                                  case "requires_payment_method":
                                    return {
                                      label: "Action Required",
                                      icon: AlertCircle,
                                      className:
                                        "text-amber-600 dark:text-amber-500",
                                      showAmount: true,
                                      showNetAmount: false,
                                    };
                                  default:
                                    return {
                                      label: "Credit purchase",
                                      icon: CheckCircle,
                                      className:
                                        "text-green-600 dark:text-green-500",
                                      showAmount: true,
                                      showNetAmount: false,
                                    };
                                }
                              };

                              const statusDisplay = getStatusDisplay();
                              const StatusIcon = statusDisplay.icon;
                              const refundedAmountCents =
                                transaction.refundedAmount ?? 0;
                              const netCents = amount - refundedAmountCents;

                              return (
                                <div
                                  key={transaction.id || index}
                                  className="flex items-center justify-between border-b border-border py-4 last:border-b-0"
                                >
                                  <div className="flex items-start gap-3">
                                    <StatusIcon
                                      size={16}
                                      className={`mt-0.5 ${statusDisplay.className}`}
                                    />
                                    <div className="flex flex-col gap-1">
                                      <div
                                        className="text-sm"
                                        title={created.toLocaleString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      >
                                        {formatDate(createdStr)}
                                      </div>
                                      <XSmall className="text-muted-foreground">
                                        {statusDisplay.label}
                                      </XSmall>
                                    </div>
                                  </div>
                                  {statusDisplay.showAmount && (
                                    <div className="flex flex-col items-end gap-0.5">
                                      <div
                                        className={`text-sm font-medium ${status === "refunded" ? "text-muted-foreground line-through" : transaction.isRefunded ? "text-green-600 dark:text-green-500" : statusDisplay.className}`}
                                      >
                                        {status !== "refunded" &&
                                        (status === "succeeded" ||
                                          status === "processing")
                                          ? "+"
                                          : ""}
                                        {(amount / 100).toLocaleString(
                                          "en-US",
                                          {
                                            style: "currency",
                                            currency: "usd",
                                          },
                                        )}
                                      </div>
                                      {transaction.refundedAmount &&
                                        transaction.refundedAmount > 0 && (
                                          <div className="text-sm font-medium text-red-600 dark:text-red-500">
                                            -
                                            {(
                                              transaction.refundedAmount / 100
                                            ).toLocaleString("en-US", {
                                              style: "currency",
                                              currency: "usd",
                                            })}
                                          </div>
                                        )}
                                      {statusDisplay.showNetAmount &&
                                        refundedAmountCents > 0 &&
                                        netCents > 0 && (
                                          <div className="mt-0.5 border-t border-border pt-0.5">
                                            <XSmall className="font-medium text-foreground">
                                              Net: +
                                              {(netCents / 100).toLocaleString(
                                                "en-US",
                                                {
                                                  style: "currency",
                                                  currency: "usd",
                                                },
                                              )}
                                            </XSmall>
                                          </div>
                                        )}
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                        {/* Pagination */}
                        <div className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (hasPrevious) {
                                const newHistory = [...pageTokenHistory];
                                newHistory.pop();
                                const previousToken =
                                  newHistory.length > 0
                                    ? newHistory[newHistory.length - 1]
                                    : null;
                                setPageTokenHistory(newHistory);
                                setCurrentPageToken(previousToken);
                              }
                            }}
                            disabled={!hasPrevious}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Badge variant="secondary" className="text-xs">
                            Page {currentPageNumber}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (hasMore && transactionsData?.nextPage) {
                                setPageTokenHistory([
                                  ...pageTokenHistory,
                                  currentPageToken || "",
                                ]);
                                setCurrentPageToken(transactionsData.nextPage);
                              }
                            }}
                            disabled={!hasMore}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Muted>No transactions yet</Muted>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent
              value="usage"
              className="mt-0 flex min-h-0 flex-col data-[state=inactive]:hidden"
            >
              <div className="flex items-center justify-between border-b px-6 py-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Small className="text-muted-foreground">From:</Small>
                    <DatePicker
                      date={startDate}
                      onDateChange={(d) => d && setStartDate(d)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Small className="text-muted-foreground">To:</Small>
                    <DatePicker
                      date={endDate}
                      onDateChange={(d) => d && setEndDate(d)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-mono text-lg font-semibold">
                    {breakdownLoading
                      ? "..."
                      : breakdownError
                        ? "-"
                        : formatCost(breakdownData?.totalCost ?? 0)}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {breakdownLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : breakdownError ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-destructive">Error loading data</span>
                  </div>
                ) : sortedModels.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-muted-foreground">
                      No spend data for this time range
                    </span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow className="border-b">
                        <SortableHeader field="model">Model</SortableHeader>
                        <SortableHeader field="provider">
                          Provider
                        </SortableHeader>
                        <SortableHeader field="inputTokens" align="right">
                          Input
                        </SortableHeader>
                        <SortableHeader field="outputTokens" align="right">
                          Output
                        </SortableHeader>
                        <SortableHeader field="cacheReadTokens" align="right">
                          Cache Read
                        </SortableHeader>
                        <SortableHeader field="cacheWriteTokens" align="right">
                          Cache Write
                        </SortableHeader>
                        <TableHead className="text-right">Input $/1M</TableHead>
                        <TableHead className="text-right">Output $/1M</TableHead>
                        <TableHead className="text-right">Cache Rd $/1M</TableHead>
                        <TableHead className="text-right">Cache Wr $/1M</TableHead>
                        <SortableHeader field="total" align="right">
                          Cost
                        </SortableHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedModels.map((item: ModelSpend, index: number) => (
                        <TableRow
                          key={`${item.model}-${item.provider}-${index}`}
                        >
                          <TableCell className="font-medium">
                            {item.model || "(unknown)"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.provider || "(unknown)"}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {formatTokens(item.promptTokens)}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {formatTokens(item.completionTokens)}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {formatTokens(item.cacheReadTokens)}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {formatTokens(item.cacheWriteTokens)}
                          </TableCell>
                          <TableCell className="font-mono text-right text-muted-foreground">
                            {formatPrice(item.pricing?.inputPer1M)}
                          </TableCell>
                          <TableCell className="font-mono text-right text-muted-foreground">
                            {formatPrice(item.pricing?.outputPer1M)}
                          </TableCell>
                          <TableCell className="font-mono text-right text-muted-foreground">
                            {formatPrice(item.pricing?.cacheReadPer1M)}
                          </TableCell>
                          <TableCell className="font-mono text-right text-muted-foreground">
                            {formatPrice(item.pricing?.cacheWritePer1M)}
                          </TableCell>
                          <TableCell className="font-mono text-right font-semibold">
                            {formatCost(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* Invoices Tab (only shown when invoices exist) */}
            {invoices.length > 0 && (
              <TabsContent
                value="invoices"
                className="mt-0 flex min-h-0 flex-col data-[state=inactive]:hidden"
              >
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow className="border-b">
                        <TableHead>Period</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {new Date(invoice.startDate).toLocaleDateString()} -{" "}
                            {new Date(invoice.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-mono text-right font-semibold">
                            {(invoice.amountCents / 100).toLocaleString(
                              "en-US",
                              { style: "currency", currency: "usd" },
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {invoice.hostedInvoiceUrl ? (
                              <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                View <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Pending
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            )}

            {/* Discounts Tab (only shown when discounts exist) */}
            {discounts.length > 0 && (
              <TabsContent
                value="discounts"
                className="mt-0 flex min-h-0 flex-col data-[state=inactive]:hidden"
              >
                <div className="border-b px-6 py-3">
                  <Muted>
                    These discounts will be applied to your future invoices.
                  </Muted>
                </div>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow className="border-b">
                        <TableHead>Provider</TableHead>
                        <TableHead>Model Pattern</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts.map((discount, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {discount.provider || "(any)"}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {discount.model || "(any)"}
                          </TableCell>
                          <TableCell className="font-mono text-right font-semibold text-green-600">
                            {discount.percent}% off
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
      <AutoTopoffModal
        isOpen={isAutoTopoffModalOpen}
        onClose={() => setIsAutoTopoffModalOpen(false)}
      />
      <LastTopoffDetailsModal
        isOpen={isLastTopoffModalOpen}
        onClose={() => setIsLastTopoffModalOpen(false)}
      />
    </div>
  );
};

Credits.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Credits;

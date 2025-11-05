import { useOrg } from "@/components/layout/org/organizationContext";
import PaymentModal from "@/components/templates/settings/PaymentModal";
import { AutoTopoffModal } from "@/components/templates/settings/AutoTopoffModal";
import { LastTopoffDetailsModal } from "@/components/templates/settings/LastTopoffDetailsModal";
import Header from "@/components/shared/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Muted, Small, XSmall } from "@/components/ui/typography";
import {
  useCredits,
  useCreditTransactions,
  type PurchasedCredits,
} from "@/services/hooks/useCredits";
import { useAutoTopoffSettings } from "@/services/hooks/useAutoTopoff";
import { formatDate } from "@/utils/date";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  CreditCard,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ReactElement, useState } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import { NextPageWithLayout } from "./_app";

const Credits: NextPageWithLayout<void> = () => {
  const [currentPageToken, setCurrentPageToken] = useState<string | null>(null);
  const [pageTokenHistory, setPageTokenHistory] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAutoTopoffModalOpen, setIsAutoTopoffModalOpen] = useState(false);
  const [isLastTopoffModalOpen, setIsLastTopoffModalOpen] = useState(false);

  const org = useOrg();

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

  const transactions = transactionsData?.purchases || [];
  const hasMore = transactionsData?.hasMore || false;
  const hasPrevious = pageTokenHistory.length > 0;
  const currentPageNumber = pageTokenHistory.length + 1;

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
              }}
              disabled={isLoading || transactionsLoading}
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading || transactionsLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-7xl flex-col">
          <div className="flex-1 overflow-auto p-6">
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
                      <span className="text-muted-foreground">Loading...</span>
                    ) : creditError ? (
                      <span className="text-destructive">
                        Error loading balance
                      </span>
                    ) : (
                      `$${(() => {
                        const balance = creditData?.balance ?? 0;
                        if (balance % 1 === 0) {
                          return balance.toFixed(2);
                        }
                        if (balance >= 100) {
                          return balance.toFixed(5);
                        }
                        if (balance >= 10) {
                          return balance.toFixed(4);
                        }
                        const formattedBalance = balance.toFixed(6);
                        return formattedBalance;
                      })()}`
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Buy Credits and Auto Top-Up Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Buy Credits Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-muted-foreground" />
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
                    <Link href="/requests" className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        View Usage
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Auto Top-Up Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={20} className="text-muted-foreground" />
                        <CardTitle className="text-base">Auto Top-Up</CardTitle>
                      </div>
                      {autoTopoffSettings && (
                        <Badge
                          variant={
                            autoTopoffSettings.enabled ? "default" : "secondary"
                          }
                        >
                          {autoTopoffSettings.enabled ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Muted className="text-xs">
                      Automatically purchase credits when your balance falls below a threshold.
                    </Muted>

                    {autoTopoffSettings?.enabled && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Wallet size={14} className="text-muted-foreground" />
                          <span>
                            Triggers at $
                            {(autoTopoffSettings.thresholdCents / 100).toFixed(
                              0
                            )}{" "}
                            • Tops up $
                            {(autoTopoffSettings.topoffAmountCents / 100).toFixed(
                              0
                            )}
                          </span>
                        </div>
                        {autoTopoffSettings.lastTopoffAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock size={14} />
                            <span>
                              Last top-off:{" "}
                              <span
                                onClick={() => setIsLastTopoffModalOpen(true)}
                                className="underline cursor-pointer hover:text-foreground"
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
                          // Reset pagination when changing page size
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
                  <div>
                    <div>
                      {transactionsLoading ? (
                        <div className="py-8 text-center">
                          <Muted>Loading transactions...</Muted>
                        </div>
                      ) : transactionsError ? (
                        <div className="py-8 text-center">
                          <Muted>Error loading transactions</Muted>
                        </div>
                      ) : transactions.length > 0 ? (
                        <div className="space-y-0">
                          {transactions.map(
                            (transaction: PurchasedCredits, index: number) => {
                              // Backend returns credits in cents
                              const amount = transaction.credits || 0;

                              // Convert timestamp to Date
                              const created = new Date(transaction.createdAt);
                              const createdStr = created.toISOString();

                              // Get status from transaction
                              const status = transaction.status;

                              // Determine status display properties
                              const getStatusDisplay = () => {
                                // Handle fully refunded transactions
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

                                // Handle partially refunded transactions
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

                                // Handle regular payments
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
                                      {/* Always show original payment amount */}
                                      <div
                                        className={`text-sm font-medium ${
                                          status === "refunded"
                                            ? "text-muted-foreground line-through"
                                            : transaction.isRefunded
                                              ? "text-green-600 dark:text-green-500"
                                              : statusDisplay.className
                                        }`}
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

                                      {/* Show refunded amount if there are refunds */}
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

                                      {/* Show net amount for partially refunded payments */}
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
                      ) : (
                        <div className="py-8 text-center">
                          <Muted>No transactions yet</Muted>
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {transactions.length > 0 && (
                      <div className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Go to previous page
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
                            // Go to next page
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
                    )}
                </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      {/* Auto Top-Off Modal */}
      <AutoTopoffModal
        isOpen={isAutoTopoffModalOpen}
        onClose={() => setIsAutoTopoffModalOpen(false)}
      />

      {/* Last Top-Off Details Modal */}
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

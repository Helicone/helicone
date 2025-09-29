import { useOrg } from "@/components/layout/org/organizationContext";
import PaymentModal from "@/components/templates/settings/PaymentModal";
import Header from "@/components/shared/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Muted, Small, XSmall } from "@/components/ui/typography";
import {
  useCredits,
  useCreditTransactions,
  type PurchasedCredits,
} from "@/services/hooks/useCredits";
import { formatDate } from "@/utils/date";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ReactElement, useState } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import { NextPageWithLayout } from "./_app";
import { useFeatureFlag } from "@/services/hooks/admin";
import { FeatureWaitlist } from "@/components/templates/waitlist/FeatureWaitlist";

const Credits: NextPageWithLayout<void> = () => {
  const [currentPageToken, setCurrentPageToken] = useState<string | null>(null);
  const [pageTokenHistory, setPageTokenHistory] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const org = useOrg();

  const { data: hasCreditsFeatureFlag, isLoading: isFeatureFlagLoading } =
    useFeatureFlag("credits", org?.currentOrg?.id ?? "");

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

  const transactions = transactionsData?.purchases || [];
  const hasMore = transactionsData?.hasMore || false;
  const hasPrevious = pageTokenHistory.length > 0;
  const currentPageNumber = pageTokenHistory.length + 1;

  const hasAccess = hasCreditsFeatureFlag?.data;

  // Show loading state while checking feature flag
  if (isFeatureFlagLoading) {
    return (
      <div className="flex h-full w-full flex-col">
        <Header title="Credits" />
        <div className="flex flex-1 items-center justify-center">
          <Small className="text-muted-foreground">Loading...</Small>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <Header
        title="Credits"
        rightActions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
            {hasAccess && (
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
            )}
          </div>
        }
      />

      <div className="flex flex-1 justify-center">
        <div className="flex w-full flex-col">
          <div className="flex-1 overflow-auto">
            {/* Waitlist Experience - Show when no access */}
            {!hasAccess ? (
              <div className="px-4 py-12 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="mb-16 text-center">
                  <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-slate-100">
                    Helicone Credits
                  </h1>
                  <p className="mb-8 text-xl text-slate-600 dark:text-slate-400">
                    Pay-as-you-go LLM billing. Simple, transparent, and
                    flexible.
                  </p>
                </div>

                {/* Demo Image with Waitlist Overlay */}
                <div className="mb-16">
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <Image
                      src="/static/credits-demo.png"
                      alt="Credits Dashboard Demo"
                      width={1200}
                      height={600}
                      className="h-auto w-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
                        <FeatureWaitlist
                          feature="credits"
                          title="Get Early Access"
                          description="Be the first to know when Credits launches for your organization."
                          organizationId={org?.currentOrg?.id}
                          variant="flat"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="mb-16">
                  <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Why Helicone Credits?
                  </h2>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                          No subscriptions or commitments
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Add credits when you need them. Pay only for what you
                          use with no monthly fees.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                          Real-time usage tracking
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Monitor your AI spending as it happens with detailed
                          analytics and insights.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                          Shared across your team
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          One balance for your entire organization. Simplify
                          billing and management.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                          Detailed transaction history
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Complete visibility into every credit spent with
                          comprehensive reporting.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Credits Management Experience - Show when has access */
              <div>
                {/* Current Balance Section */}
                <div className="border-b border-border bg-slate-100 px-6 py-8 dark:bg-slate-900">
                  <Small className="text-muted-foreground">
                    Current Balance
                  </Small>
                  <div className="mt-2 text-3xl font-bold">
                    {isLoading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : creditError ? (
                      <span className="text-destructive">
                        Error loading balance
                      </span>
                    ) : (
                      `$${(() => {
                        const balance = (creditData?.balance ?? 0) / 100;
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
                </div>

                {/* Buy Credits and Auto Top-Up Section */}
                <div className="border-b border-border px-6 py-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Buy Credits */}
                    <div>
                      <Small className="mb-4 font-semibold text-slate-900 dark:text-slate-100">
                        Buy Credits
                      </Small>
                      <div className="mt-2 flex flex-col gap-3">
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
                      </div>
                    </div>

                    {/* Auto Top-Up */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <Small className="font-semibold text-slate-900 dark:text-slate-100">
                          Auto Top-Up
                        </Small>
                        <div className="opacity-50">
                          <Switch checked={false} disabled />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Small className="text-xs text-muted-foreground">
                          <span className="italic">
                            Auto Top-Up is still in development and not yet
                            available.
                          </span>
                        </Small>
                        <Muted className="text-xs">
                          Automatically purchase credits when your balance is
                          below a certain threshold. Your most recent payment
                          method will be used.
                        </Muted>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Section */}
                <div className="px-6 py-8">
                  <div className="mb-6 flex items-center justify-between">
                    <Small className="font-semibold text-slate-900 dark:text-slate-100">
                      Recent Transactions
                    </Small>
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
                                      className={`mt-0.5 h-4 w-4 ${statusDisplay.className}`}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal - Only when has access */}
      {hasAccess && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}
    </div>
  );
};

Credits.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Credits;

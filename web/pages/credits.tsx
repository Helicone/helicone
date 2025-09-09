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
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ReactElement, useState } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import { NextPageWithLayout } from "./_app";
import { useFeatureFlag } from "@/services/hooks/admin";
import { FeatureWaitlist } from "@/components/templates/waitlist/FeatureWaitlist";

const Credits: NextPageWithLayout<void> = () => {
  const [currentPage, setCurrentPage] = useState(0);
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
    page: currentPage,
    pageSize: pageSize,
  });

  const transactions = transactionsData?.purchases || [];
  const totalTransactions = transactionsData?.total || 0;
  const totalPages = Math.ceil(totalTransactions / pageSize);
  const hasMore = currentPage < totalPages - 1;
  const hasPrevious = currentPage > 0;

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
        leftActions={<Badge variant="helicone-sky">BETA</Badge>}
        rightActions={
          <Link
            href="https://docs.helicone.ai/gateway/credits"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            📖 Docs
          </Link>
        }
      />

      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-6xl flex-col border-l border-r border-border">
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
                  <div className="mb-8 text-center">
                    <Link
                      href="https://docs.helicone.ai/gateway/credits"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                      📖 Learn about credits & pricing
                    </Link>
                  </div>
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
                <div className="border-b border-border px-6 py-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <Small className="text-muted-foreground">
                        Current Balance
                      </Small>
                      <div className="mt-2 text-3xl font-bold">
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
                            const balance = (creditData?.balance ?? 0) / 100;
                            if (balance % 1 === 0) {
                              return balance.toFixed(2);
                            }
                            if (balance >= 100) {
                              return balance.toFixed(4);
                            }
                            if (balance >= 10) {
                              return balance.toFixed(3);
                            }
                            const formattedBalance = balance.toFixed(5);
                            return formattedBalance;
                          })()}`
                        )}
                      </div>
                    </div>
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
                          setCurrentPage(0);
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

                              // All transactions are credit purchases for now
                              const description = "Credit purchase";
                              const isCredit = true; // All are credits being added

                              return (
                                <div
                                  key={transaction.id || index}
                                  className="flex items-center justify-between border-b border-border py-4 last:border-b-0"
                                >
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
                                      {description}
                                    </XSmall>
                                  </div>
                                  <div
                                    className={`text-sm font-medium ${isCredit ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}`}
                                  >
                                    {isCredit ? "+" : "-"}
                                    {(amount / 100).toLocaleString("en-US", {
                                      style: "currency",
                                      currency: "usd",
                                    })}
                                  </div>
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
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          disabled={!hasPrevious}
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Badge variant="secondary" className="text-xs">
                          Page {currentPage + 1} of {totalPages || 1}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Go to next page
                            if (hasMore) {
                              setCurrentPage(currentPage + 1);
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

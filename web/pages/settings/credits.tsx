import { useOrg } from "@/components/layout/org/organizationContext";
import PaymentModal from "@/components/templates/settings/PaymentModal";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ReactElement, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { NextPageWithLayout } from "../_app";
import { useFeatureFlag } from "@/services/hooks/admin";
import { FeatureWaitlist } from "@/components/templates/waitlist/FeatureWaitlist";

const CreditsSettings: NextPageWithLayout<void> = () => {
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

  // Show waitlist if feature flag is not enabled
  if (!hasCreditsFeatureFlag?.data && !isFeatureFlagLoading) {
    return (
      <div className="flex w-full justify-center px-4 py-4">
        <div className="w-full max-w-4xl">
          <FeatureWaitlist
            feature="credits"
            title="Credits Feature - Coming Soon!"
            description="Join the waitlist to be notified when our credits system becomes available for your organization."
            organizationId={org?.currentOrg?.id}
          />
        </div>
      </div>
    );
  }

  // Show loading state while checking feature flag
  if (isFeatureFlagLoading) {
    return (
      <div className="flex w-full justify-center px-4 py-4">
        <div className="w-full max-w-4xl">
          <Card className="w-full">
            <CardContent className="flex h-32 items-center justify-center">
              <Small className="text-muted-foreground">Loading...</Small>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center px-4 py-4">
      <div className="w-full max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium">Credits</CardTitle>
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
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Balance */}
            <div className="rounded-lg border bg-muted/10 p-4">
              <Small className="text-muted-foreground">Current Balance</Small>
              <div className="mt-1 text-3xl font-bold">
                {isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : creditError ? (
                  <span className="text-destructive">
                    Error loading balance
                  </span>
                ) : (
                  `$${((creditData?.balance ?? 0) / 100).toFixed(2)}`
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Buy Credits */}
              <div className="rounded-lg border p-4">
                <Small className="mb-4 font-semibold">Buy Credits</Small>
                <div className="mt-2 flex flex-col gap-4">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    Add Credits
                  </Button>
                  <Link href="/requests" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      View Usage
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Auto Top-Up */}
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Small className="font-semibold">Auto Top-Up</Small>
                  <Switch checked={false} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Small className="text-xs text-muted-foreground">
                    <span className="italic">
                      Auto Top-Up is still in development and not yet available.
                    </span>
                  </Small>
                  <Muted className="text-xs">
                    Automatically purchase credits when your balance is below a
                    certain threshold. Your most recent payment method will be
                    used.
                  </Muted>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Small className="font-semibold">Recent Transactions</Small>
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

              <div className="rounded-lg border">
                <div className="p-4">
                  {transactionsLoading ? (
                    <div className="py-8 text-center">
                      <Muted>Loading transactions...</Muted>
                    </div>
                  ) : transactionsError ? (
                    <div className="py-8 text-center">
                      <Muted>Error loading transactions</Muted>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-2">
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
                              className="flex items-center justify-between border-b py-3 last:border-b-0"
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
                  <div className="border-t p-4">
                    <div className="flex items-center justify-center gap-2">
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
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
};

CreditsSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default CreditsSettings;

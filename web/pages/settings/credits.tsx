import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Small, XSmall, Muted } from "@/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCredits,
  useCreditTransactions,
  useCreateCheckoutSession,
} from "@/services/hooks/useCredits";
import Link from "next/link";
import { formatDate } from "@/utils/date";
import PaymentModal from "@/components/templates/settings/PaymentModal";

const CreditsSettings: NextPageWithLayout<void> = () => {
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(false);
  const [startingAfter, setStartingAfter] = useState<string | undefined>(
    undefined,
  );
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch actual credit balance
  const { data: creditData, isLoading, error, refetch } = useCredits();
  const currentBalance = creditData?.balance ?? 0;

  // Fetch transactions with pagination
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useCreditTransactions({
    limit: pageSize,
    starting_after: startingAfter,
  });

  const transactions = transactionsData?.data ?? [];
  const hasMore = transactionsData?.has_more ?? false;

  // Use the custom hook for creating checkout session
  const createCheckoutSession = useCreateCheckoutSession();

  const handlePaymentSubmit = (amount: number) => {
    createCheckoutSession.mutate(amount);
  };

  return (
    <div className="flex w-full justify-center px-4 py-4">
      <div className="w-full max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            {/* Coming Soon Banner */}
            <div className="-m-6 mb-4 rounded-t-lg border-b border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <div className="text-center text-sm font-medium">
                🚧 Coming Soon - Credits system is currently under development
              </div>
            </div>

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
                ) : error ? (
                  <span className="text-destructive">
                    Error loading balance
                  </span>
                ) : (
                  `$${(currentBalance / 100).toFixed(2)}`
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
                    disabled={createCheckoutSession.isPending}
                  >
                    {createCheckoutSession.isPending
                      ? "Loading..."
                      : "Add Credits"}
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
                    <span className="italic">Auto Top-Up is still in development and not yet available.</span>
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
                      setStartingAfter(undefined);
                      setPageHistory([]);
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
                  ) : transactions.length > 0 ? (
                    <div className="space-y-2">
                      {transactions.map((transaction: any) => {
                        const isCredit = transaction.type === "credit";
                        const transactionData = isCredit
                          ? transaction.credit
                          : transaction.debit;
                        const amount =
                          transactionData?.amount?.monetary?.value ?? 0;
                        const currency =
                          transactionData?.amount?.monetary?.currency ?? "usd";
                        const created = transaction.created
                          ? new Date(transaction.created * 1000)
                          : new Date();
                        const createdStr = created.toISOString();

                        // Determine transaction description based on type
                        let description = "Credit transaction";
                        if (isCredit && transactionData?.type) {
                          description = transactionData.type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l: string) => l.toUpperCase());
                        } else if (!isCredit && transactionData?.type) {
                          description = transactionData.type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l: string) => l.toUpperCase());
                        }

                        return (
                          <div
                            key={transaction.id}
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
                                currency: currency,
                              })}
                            </div>
                            {transaction.invoice && (
                              <Button variant="ghost" size="sm">
                                <span>Get invoice</span>
                                <FileText className="ml-1 h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
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
                          if (pageHistory.length > 0) {
                            const newHistory = [...pageHistory];
                            const prevCursor = newHistory.pop();
                            setPageHistory(newHistory);
                            setStartingAfter(prevCursor);
                          }
                        }}
                        disabled={pageHistory.length === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Badge variant="secondary" className="text-xs">
                        Page {pageHistory.length + 1}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Go to next page using the last transaction's ID as cursor
                          if (hasMore && transactions.length > 0) {
                            const lastTransaction =
                              transactions[transactions.length - 1];
                            if (lastTransaction?.id) {
                              setPageHistory([
                                ...pageHistory,
                                startingAfter || "",
                              ]);
                              setStartingAfter(lastTransaction.id);
                            }
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
        onSubmit={handlePaymentSubmit}
        isLoading={createCheckoutSession.isPending}
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

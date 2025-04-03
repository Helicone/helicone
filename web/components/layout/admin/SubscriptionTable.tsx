import React, { useState } from "react";
import { Plus, Minus, Tag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type Stripe from "stripe";
import { formatCurrency, formatDate } from "@/lib/stripeUtils";
import {
  MOCK_SUBSCRIPTIONS,
  MOCK_INVOICES,
  MOCK_DISCOUNTS,
} from "./mockStripeData";
import { SubscriptionAnalytics } from "@/lib/SubscriptionAnalytics";

// JSON display component for raw data
const JsonDisplay = ({ data }: { data: any }) => {
  return (
    <pre className="bg-slate-900 p-4 rounded-md text-xs overflow-auto max-h-[400px]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

// Component props
type SubscriptionTableProps = {
  subscriptions?: Stripe.Subscription[];
  invoices?: Stripe.Invoice[];
  discounts?: Record<string, Stripe.Discount>;
  analytics?: SubscriptionAnalytics;
  isLoading?: boolean;
};

const SubscriptionTable = ({
  subscriptions = MOCK_SUBSCRIPTIONS,
  invoices = MOCK_INVOICES,
  discounts = MOCK_DISCOUNTS,
  analytics,
  isLoading = false,
}: SubscriptionTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Use provided analytics instance or create a new one if not provided
  const subscriptionAnalytics =
    analytics ||
    new SubscriptionAnalytics({
      subscriptions,
      invoices,
      discounts,
    });

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading) {
    return <div className="p-4">Loading subscription data...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Subscription ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">MRR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => {
            const subAnalytics = subscriptionAnalytics.getSubscriptionAnalytics(
              subscription.id
            );
            const isExpanded = !!expandedRows[subscription.id];
            const hasDiscount = subscription.id in discounts;

            return (
              <React.Fragment key={subscription.id}>
                <TableRow
                  className={`cursor-pointer ${
                    isExpanded ? "bg-slate-50 dark:bg-slate-800" : ""
                  }`}
                  onClick={() => toggleRow(subscription.id)}
                >
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {isExpanded ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {subscription.id}
                    {subscription.metadata?.tier && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-800/30 dark:text-blue-400">
                        {subscription.metadata.tier}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        subscription.status === "active"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : subscription.status === "past_due"
                          ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {subscription.status}
                      {subscription.cancel_at_period_end && (
                        <span className="ml-1">(canceling)</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatDate(subscription.current_period_start)} -{" "}
                    {formatDate(subscription.current_period_end)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(subAnalytics.currentMRR)}
                    {hasDiscount && (
                      <Tag className="ml-2 h-3 w-3 text-yellow-500" />
                    )}
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4">
                        <Tabs defaultValue="details">
                          <TabsList>
                            <TabsTrigger value="details">
                              Subscription Details
                            </TabsTrigger>
                            <TabsTrigger value="items">Line Items</TabsTrigger>
                            <TabsTrigger value="invoices">
                              Past Invoices
                            </TabsTrigger>
                            <TabsTrigger value="discounts">
                              Discounts
                            </TabsTrigger>
                            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                          </TabsList>

                          {/* Tab 1: Subscription Details */}
                          <TabsContent value="details">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h3 className="text-sm font-medium mb-2">
                                  General Information
                                </h3>
                                <dl className="space-y-1">
                                  <div className="flex justify-between">
                                    <dt className="text-sm text-slate-500">
                                      Customer ID:
                                    </dt>
                                    <dd className="text-sm font-mono">
                                      {typeof subscription.customer === "string"
                                        ? subscription.customer
                                        : subscription.customer?.id}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-sm text-slate-500">
                                      Created:
                                    </dt>
                                    <dd className="text-sm">
                                      {formatDate(subscription.created)}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-sm text-slate-500">
                                      Status:
                                    </dt>
                                    <dd className="text-sm">
                                      {subscription.status}
                                    </dd>
                                  </div>
                                  {subscription.metadata &&
                                    Object.keys(subscription.metadata).length >
                                      0 && (
                                      <div className="flex justify-between">
                                        <dt className="text-sm text-slate-500">
                                          Metadata:
                                        </dt>
                                        <dd className="text-sm font-mono">
                                          {Object.entries(
                                            subscription.metadata
                                          ).map(([key, value]) => (
                                            <div key={key}>
                                              {key}: {value}
                                            </div>
                                          ))}
                                        </dd>
                                      </div>
                                    )}
                                </dl>
                              </div>

                              <div>
                                <h3 className="text-sm font-medium mb-2">
                                  Billing Information
                                </h3>
                                <dl className="space-y-1">
                                  <div className="flex justify-between">
                                    <dt className="text-sm text-slate-500">
                                      Current Period:
                                    </dt>
                                    <dd className="text-sm">
                                      {formatDate(
                                        subscription.current_period_start
                                      )}{" "}
                                      -{" "}
                                      {formatDate(
                                        subscription.current_period_end
                                      )}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-sm text-slate-500">
                                      Cancel at Period End:
                                    </dt>
                                    <dd className="text-sm">
                                      {subscription.cancel_at_period_end
                                        ? "Yes"
                                        : "No"}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-sm text-slate-500">
                                      Monthly Recurring Revenue:
                                    </dt>
                                    <dd className="text-sm font-medium">
                                      {formatCurrency(subAnalytics.currentMRR)}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-sm text-slate-500">
                                      Lifetime Value:
                                    </dt>
                                    <dd className="text-sm font-medium">
                                      {formatCurrency(
                                        subAnalytics.lifetimeValue
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Tab 2: Line Items */}
                          <TabsContent value="items">
                            <div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Item ID</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">
                                      MRR
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {subscription.items.data.map((item) => {
                                    const unitAmount =
                                      item.price?.unit_amount || 0;
                                    const interval =
                                      item.price?.recurring?.interval ||
                                      "month";
                                    const intervalCount =
                                      item.price?.recurring?.interval_count ||
                                      1;

                                    // Find item analytics
                                    const itemAnalytics =
                                      subAnalytics.items.find(
                                        (i) => i.id === item.id
                                      );

                                    return (
                                      <TableRow key={item.id}>
                                        <TableCell className="font-mono text-xs">
                                          {item.id}
                                        </TableCell>
                                        <TableCell>
                                          {itemAnalytics?.productName ||
                                            "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                          {item.quantity || 1}
                                        </TableCell>
                                        <TableCell>
                                          {formatCurrency(unitAmount)}/
                                          {interval}
                                          {intervalCount > 1 &&
                                            `/${intervalCount}`}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {formatCurrency(
                                            itemAnalytics?.mrr || 0
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>

                          {/* Tab 3: Past Invoices */}
                          <TabsContent value="invoices">
                            <div>
                              {(() => {
                                const subscriptionInvoices =
                                  subscriptionAnalytics.getInvoicesForSubscription(
                                    subscription.id
                                  );
                                return subscriptionInvoices.length ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                          Amount
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {subscriptionInvoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                          <TableCell className="font-mono text-xs">
                                            {invoice.id}
                                          </TableCell>
                                          <TableCell>
                                            {formatDate(invoice.created)}
                                          </TableCell>
                                          <TableCell>
                                            <span
                                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                                invoice.status === "paid"
                                                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                  : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                              }`}
                                            >
                                              {invoice.status}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {formatCurrency(invoice.total)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <div className="text-sm text-slate-500 p-4">
                                    No invoices found for this subscription.
                                  </div>
                                );
                              })()}
                            </div>
                          </TabsContent>

                          {/* Tab 4: Discounts */}
                          <TabsContent value="discounts">
                            <div>
                              {discounts[subscription.id] ? (
                                <div className="space-y-4">
                                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                                    <h3 className="text-sm font-medium mb-2">
                                      Discount Information
                                    </h3>
                                    <dl className="space-y-1">
                                      <div className="flex justify-between">
                                        <dt className="text-sm text-slate-500">
                                          Coupon:
                                        </dt>
                                        <dd className="text-sm font-mono">
                                          {discounts[subscription.id].coupon.id}
                                        </dd>
                                      </div>
                                      <div className="flex justify-between">
                                        <dt className="text-sm text-slate-500">
                                          Discount Type:
                                        </dt>
                                        <dd className="text-sm">
                                          {discounts[subscription.id].coupon
                                            .percent_off
                                            ? `${
                                                discounts[subscription.id]
                                                  .coupon.percent_off
                                              }% off`
                                            : formatCurrency(
                                                discounts[subscription.id]
                                                  .coupon.amount_off || 0
                                              )}
                                        </dd>
                                      </div>
                                      <div className="flex justify-between">
                                        <dt className="text-sm text-slate-500">
                                          Duration:
                                        </dt>
                                        <dd className="text-sm">
                                          {
                                            discounts[subscription.id].coupon
                                              .duration
                                          }
                                        </dd>
                                      </div>
                                      {discounts[subscription.id].coupon
                                        .duration_in_months && (
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-slate-500">
                                            Duration Months:
                                          </dt>
                                          <dd className="text-sm">
                                            {
                                              discounts[subscription.id].coupon
                                                .duration_in_months
                                            }
                                          </dd>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <dt className="text-sm text-slate-500">
                                          Start Date:
                                        </dt>
                                        <dd className="text-sm">
                                          {formatDate(
                                            discounts[subscription.id].start
                                          )}
                                        </dd>
                                      </div>
                                      {discounts[subscription.id].end && (
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-slate-500">
                                            End Date:
                                          </dt>
                                          <dd className="text-sm">
                                            {formatDate(
                                              discounts[subscription.id].end ||
                                                undefined
                                            )}
                                          </dd>
                                        </div>
                                      )}
                                    </dl>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-slate-500 p-4">
                                  No discounts found for this subscription.
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          {/* Tab 5: Raw JSON */}
                          <TabsContent value="raw">
                            <JsonDisplay data={subscription} />
                          </TabsContent>
                        </Tabs>

                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            View in Stripe
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubscriptionTable;

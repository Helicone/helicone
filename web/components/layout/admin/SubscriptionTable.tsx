import React, { useState } from "react";
import { Plus, Minus, ExternalLink, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type Stripe from "stripe";
import {
  formatCurrency,
  formatDate,
  getCustomerEmail,
  getStatusBadgeClasses,
  getTierBadgeClasses,
} from "@/lib/stripeUtils";
import {
  MOCK_SUBSCRIPTIONS,
  MOCK_INVOICES,
  MOCK_DISCOUNTS,
} from "./mockStripeData";
import { SubscriptionAnalytics } from "@/lib/SubscriptionAnalytics";
import { cn } from "@/lib/utils";

// JSON display component for raw data
const JsonDisplay = ({ data }: { data: any }) => {
  // Function to format the JSON with indentation
  const formatJSON = (obj: any) => {
    // Convert to formatted JSON string with 2-space indentation
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
          JSON Data
        </span>
      </div>
      <div className="bg-white dark:bg-slate-950 overflow-auto">
        <pre className="p-4 m-0 text-sm font-mono text-slate-800 dark:text-slate-200 max-h-[500px] overflow-x-auto whitespace-pre">
          {formatJSON(data)}
        </pre>
      </div>
    </div>
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter subscriptions based on email search
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const email = getCustomerEmail(sub.customer).toLowerCase();
    return email.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return <div className="p-4">Loading subscription data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-slate-500">
          {filteredSubscriptions.length} subscription
          {filteredSubscriptions.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>Lifetime Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.map((subscription, index) => {
              const subAnalytics =
                subscriptionAnalytics.getSubscriptionAnalytics(subscription.id);
              const isExpanded = !!expandedRows[subscription.id];
              const hasDiscount = subscription.id in discounts;

              // Get customer email - in a real implementation, this would come from Stripe customer data
              const customerEmail = getCustomerEmail(subscription.customer);

              // Get tier from metadata or use "Unknown"
              const tier = subscription.metadata?.tier || "Unknown";

              return (
                <React.Fragment key={`${subscription.id}-${index}`}>
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
                    <TableCell
                      className="text-sm max-w-[150px] truncate"
                      title={customerEmail}
                    >
                      {customerEmail}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "border inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                          getTierBadgeClasses(tier)
                        )}
                      >
                        {tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasDiscount &&
                      subAnalytics.currentMRR !== subAnalytics.discountedMRR ? (
                        <>
                          <span className="line-through text-slate-500">
                            {formatCurrency(subAnalytics.currentMRR)}
                          </span>{" "}
                          <span className="text-green-600">
                            {formatCurrency(subAnalytics.discountedMRR)}
                            <span className="ml-1 text-xs text-green-500">
                              (-
                              {Math.round(
                                ((subAnalytics.currentMRR -
                                  subAnalytics.discountedMRR) /
                                  subAnalytics.currentMRR) *
                                  100
                              )}
                              %)
                            </span>
                          </span>
                        </>
                      ) : (
                        formatCurrency(subAnalytics.currentMRR)
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(subAnalytics.lifetimeValue)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "border inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                          getStatusBadgeClasses(
                            subscription.status,
                            subscription.cancel_at_period_end
                          )
                        )}
                      >
                        {subscription.status}
                        {subscription.cancel_at_period_end && (
                          <span className="ml-1">(canceling)</span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(subscription.current_period_start)} -{" "}
                      {formatDate(subscription.current_period_end)}
                    </TableCell>
                    <TableCell>{formatDate(subscription.created)}</TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-slate-50 dark:bg-slate-800">
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 w-full">
                          <Tabs defaultValue="details" className="w-full">
                            <TabsList className="w-full">
                              <TabsTrigger value="details" className="flex-1">
                                Subscription Details
                              </TabsTrigger>
                              <TabsTrigger value="items" className="flex-1">
                                Line Items
                              </TabsTrigger>
                              <TabsTrigger value="invoices" className="flex-1">
                                Past Invoices
                              </TabsTrigger>
                              <TabsTrigger value="discounts" className="flex-1">
                                Discounts
                              </TabsTrigger>
                              <TabsTrigger value="raw" className="flex-1">
                                Raw JSON
                              </TabsTrigger>
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
                                        Customer Email:
                                      </dt>
                                      <dd className="text-sm break-all">
                                        {customerEmail}
                                      </dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-sm text-slate-500">
                                        Customer ID:
                                      </dt>
                                      <dd className="text-sm font-mono">
                                        {typeof subscription.customer ===
                                        "string"
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
                                      Object.keys(subscription.metadata)
                                        .length > 0 && (
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
                                        {hasDiscount &&
                                        subAnalytics.currentMRR !==
                                          subAnalytics.discountedMRR ? (
                                          <>
                                            <span className="line-through text-slate-500">
                                              {formatCurrency(
                                                subAnalytics.currentMRR
                                              )}
                                            </span>{" "}
                                            <span className="text-green-600">
                                              {formatCurrency(
                                                subAnalytics.discountedMRR
                                              )}
                                              <span className="text-xs text-green-500">
                                                (-
                                                {Math.round(
                                                  ((subAnalytics.currentMRR -
                                                    subAnalytics.discountedMRR) /
                                                    subAnalytics.currentMRR) *
                                                    100
                                                )}
                                                %)
                                              </span>
                                            </span>
                                          </>
                                        ) : (
                                          formatCurrency(
                                            subAnalytics.currentMRR
                                          )
                                        )}
                                      </dd>
                                    </div>
                                    {hasDiscount && (
                                      <div className="flex justify-between">
                                        <dt className="text-sm text-slate-500">
                                          Applied Discount:
                                        </dt>
                                        <dd className="text-sm font-medium text-yellow-600">
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
                                          {discounts[subscription.id].coupon
                                            .duration !== "forever" &&
                                            ` (${
                                              discounts[subscription.id].coupon
                                                .duration
                                            }${
                                              discounts[subscription.id].coupon
                                                .duration_in_months
                                                ? ` for ${
                                                    discounts[subscription.id]
                                                      .coupon.duration_in_months
                                                  } months`
                                                : ""
                                            })`}
                                        </dd>
                                      </div>
                                    )}
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
                                      <TableHead className="w-[100px]"></TableHead>
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
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="flex items-center gap-1"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(
                                                  `https://dashboard.stripe.com/prices/${item.price?.id}`,
                                                  "_blank"
                                                );
                                              }}
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                            </Button>
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
                                          <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {subscriptionInvoices.map(
                                          (invoice, index) => (
                                            <TableRow
                                              key={`${invoice.id}-${index}`}
                                            >
                                              <TableCell className="font-mono text-xs">
                                                {invoice.id}
                                              </TableCell>
                                              <TableCell>
                                                {formatDate(invoice.created)}
                                              </TableCell>
                                              <TableCell>
                                                <Badge
                                                  className={cn(
                                                    "border inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                                                    getStatusBadgeClasses(
                                                      invoice.status || ""
                                                    )
                                                  )}
                                                >
                                                  {invoice.status}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatCurrency(invoice.total)}
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="flex items-center gap-1"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(
                                                      `https://dashboard.stripe.com/invoices/${invoice.id}`,
                                                      "_blank"
                                                    );
                                                  }}
                                                >
                                                  <ExternalLink className="h-3 w-3" />
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
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
                                      <h3 className="text-sm font-medium mb-2 flex justify-between">
                                        <span>Discount Information</span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(
                                              `https://dashboard.stripe.com/coupons/${
                                                discounts[subscription.id]
                                                  .coupon.id
                                              }`,
                                              "_blank"
                                            );
                                          }}
                                        >
                                          View in Stripe
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </h3>
                                      <dl className="space-y-1">
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-slate-500">
                                            Coupon:
                                          </dt>
                                          <dd className="text-sm font-mono">
                                            {
                                              discounts[subscription.id].coupon
                                                .id
                                            }
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
                                                discounts[subscription.id]
                                                  .coupon.duration_in_months
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
                                                discounts[subscription.id]
                                                  .end || undefined
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
                              onClick={() =>
                                window.open(
                                  `https://dashboard.stripe.com/subscriptions/${subscription.id}`,
                                  "_blank"
                                )
                              }
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
    </div>
  );
};

export default SubscriptionTable;

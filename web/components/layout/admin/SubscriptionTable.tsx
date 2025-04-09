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
  getStatusBadgeClasses,
  getTierBadgeClasses,
  truncateEmail,
} from "@/lib/uiUtils";
import {
  SubscriptionTableItem,
  InvoiceTableItem,
} from "@/lib/admin/RevenueCalculator";
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

// Component props - Simplified
type SubscriptionTableProps = {
  subscriptions: SubscriptionTableItem[]; // Use the pre-calculated type
  allInvoices: InvoiceTableItem[]; // Pass all processed invoices
  discounts: Record<string, Stripe.Discount>;
  rawSubscriptions: Stripe.Subscription[]; // Pass raw for JSON view if needed
  isLoading?: boolean;
};

const SubscriptionTable = ({
  subscriptions,
  allInvoices,
  discounts,
  rawSubscriptions, // Added prop
  isLoading = false,
}: SubscriptionTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter subscriptions based on email search using the processed data
  const filteredSubscriptions = subscriptions.filter((subItem) => {
    const email = subItem.customerEmail.toLowerCase();
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
              <TableHead>Lifetime Value (LTV)</TableHead>{" "}
              {/* TODO: Calculate LTV if needed */}
              <TableHead>Status</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.map((subItem, index) => {
              const isExpanded = !!expandedRows[subItem.subscriptionId];
              const hasDiscount = subItem.subscriptionId in discounts;
              const rawSubscription = rawSubscriptions.find(
                (rs) => rs.id === subItem.subscriptionId
              );

              // Get tier from metadata or use "Unknown"
              const tier = rawSubscription?.metadata?.tier || "Unknown";
              // LTV needs to be calculated - placeholder for now
              const subLTVInvoices = rawSubscription
                ? allInvoices.filter(
                    (inv) => inv.customerEmail === subItem.customerEmail
                  ) // Filter by email as proxy for now
                : [];
              const lifetimeValue = subLTVInvoices.reduce(
                (sum, inv) => sum + inv.totalAmount,
                0
              );

              return (
                <React.Fragment key={`${subItem.subscriptionId}-${index}`}>
                  <TableRow
                    className={`cursor-pointer ${
                      isExpanded ? "bg-slate-50 dark:bg-slate-800" : ""
                    }`}
                    onClick={() => toggleRow(subItem.subscriptionId)}
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
                      title={subItem.customerEmail}
                    >
                      {truncateEmail(subItem.customerEmail)} {/* Use UI util */}
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
                      {hasDiscount && subItem.discountedMrr !== undefined ? (
                        <>
                          <span className="line-through text-slate-500">
                            {formatCurrency(subItem.mrr)}
                          </span>{" "}
                          <span className="text-green-600">
                            {formatCurrency(subItem.discountedMrr)}
                            {subItem.mrr > 0 &&
                              subItem.discountedMrr !== undefined && (
                                <span className="ml-1 text-xs text-green-500">
                                  (-
                                  {Math.round(
                                    ((subItem.mrr - subItem.discountedMrr) /
                                      subItem.mrr) *
                                      100
                                  )}
                                  %)
                                </span>
                              )}
                          </span>
                        </>
                      ) : (
                        formatCurrency(subItem.mrr)
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(lifetimeValue)}</TableCell>{" "}
                    {/* Display LTV */}
                    <TableCell>
                      <Badge
                        className={cn(
                          "border inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                          getStatusBadgeClasses(
                            subItem.status || "",
                            subItem.cancelAtPeriodEnd
                          )
                        )}
                      >
                        {subItem.status}
                        {subItem.cancelAtPeriodEnd && (
                          <span className="ml-1">(canceling)</span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{subItem.formattedNextBillingDate}</TableCell>
                    <TableCell>
                      {formatDate(rawSubscription?.created)}
                    </TableCell>
                  </TableRow>

                  {isExpanded && rawSubscription && (
                    <TableRow className="bg-slate-50 dark:bg-slate-800">
                      <TableCell colSpan={8} className="p-0">
                        {" "}
                        {/* Adjusted colspan */}
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
                                        {subItem.customerEmail}
                                      </dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-sm text-slate-500">
                                        Customer ID:
                                      </dt>
                                      <dd className="text-sm font-mono">
                                        {typeof rawSubscription.customer ===
                                        "string"
                                          ? rawSubscription.customer
                                          : rawSubscription.customer?.id}
                                      </dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-sm text-slate-500">
                                        Created:
                                      </dt>
                                      <dd className="text-sm">
                                        {formatDate(rawSubscription.created)}
                                      </dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-sm text-slate-500">
                                        Status:
                                      </dt>
                                      <dd className="text-sm">
                                        {subItem.status}
                                      </dd>
                                    </div>
                                    {rawSubscription.metadata &&
                                      Object.keys(rawSubscription.metadata)
                                        .length > 0 && (
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-slate-500">
                                            Metadata:
                                          </dt>
                                          <dd className="text-sm font-mono">
                                            {Object.entries(
                                              rawSubscription.metadata
                                            ).map(([key, value]) => (
                                              <div key={key}>
                                                {key}: {value as string}
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
                                          rawSubscription.current_period_start
                                        )}{" "}
                                        -{" "}
                                        {formatDate(
                                          rawSubscription.current_period_end
                                        )}
                                      </dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-sm text-slate-500">
                                        Cancel at Period End:
                                      </dt>
                                      <dd className="text-sm">
                                        {subItem.cancelAtPeriodEnd
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
                                        subItem.discountedMrr !== undefined ? (
                                          <>
                                            <span className="line-through text-slate-500">
                                              {formatCurrency(subItem.mrr)}
                                            </span>{" "}
                                            <span className="text-green-600">
                                              {formatCurrency(
                                                subItem.discountedMrr
                                              )}
                                              {subItem.mrr > 0 &&
                                                subItem.discountedMrr !==
                                                  undefined && (
                                                  <span className="ml-1 text-xs text-green-500">
                                                    (-
                                                    {Math.round(
                                                      ((subItem.mrr -
                                                        subItem.discountedMrr) /
                                                        subItem.mrr) *
                                                        100
                                                    )}
                                                    %)
                                                  </span>
                                                )}
                                            </span>
                                          </>
                                        ) : (
                                          formatCurrency(subItem.mrr)
                                        )}
                                      </dd>
                                    </div>
                                    {hasDiscount &&
                                      discounts[subItem.subscriptionId] && (
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-slate-500">
                                            Applied Discount:
                                          </dt>
                                          <dd className="text-sm font-medium text-yellow-600">
                                            {discounts[subItem.subscriptionId]
                                              .coupon.percent_off
                                              ? `${
                                                  discounts[
                                                    subItem.subscriptionId
                                                  ].coupon.percent_off
                                                }% off`
                                              : formatCurrency(
                                                  discounts[
                                                    subItem.subscriptionId
                                                  ].coupon.amount_off || 0
                                                )}
                                            {discounts[subItem.subscriptionId]
                                              .coupon.duration !== "forever" &&
                                              ` (${
                                                discounts[
                                                  subItem.subscriptionId
                                                ].coupon.duration
                                              }${
                                                discounts[
                                                  subItem.subscriptionId
                                                ].coupon.duration_in_months
                                                  ? ` for ${
                                                      discounts[
                                                        subItem.subscriptionId
                                                      ].coupon
                                                        .duration_in_months
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
                                        {formatCurrency(lifetimeValue)}{" "}
                                        {/* Display LTV */}
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
                                    {rawSubscription.items.data.map(
                                      (item: Stripe.SubscriptionItem) => {
                                        // Add type
                                        const unitAmount =
                                          item.price?.unit_amount || 0;
                                        const interval =
                                          item.price?.recurring?.interval ||
                                          "month";
                                        const intervalCount =
                                          item.price?.recurring
                                            ?.interval_count || 1;
                                        // Find the matching processed subItem to get productName and MRR
                                        const processedSubItem =
                                          subscriptions.find(
                                            (si) =>
                                              si.subscriptionId ===
                                                rawSubscription.id &&
                                              si.productName ===
                                                item.price?.lookup_key
                                          );
                                        const productName =
                                          processedSubItem?.productName ||
                                          "Unknown";
                                        const itemMrr =
                                          processedSubItem?.mrr || 0; // Use pre-calculated MRR

                                        return (
                                          <TableRow key={item.id}>
                                            <TableCell className="font-mono text-xs">
                                              {item.id}
                                            </TableCell>
                                            <TableCell>{productName}</TableCell>
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
                                              {formatCurrency(itemMrr)}
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
                                      }
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </TabsContent>

                            {/* Tab 3: Past Invoices */}
                            <TabsContent value="invoices">
                              <div>
                                {(() => {
                                  // Filter the pre-processed invoices for this subscription
                                  const subscriptionInvoices =
                                    allInvoices.filter(
                                      // TODO: Need subscription ID on InvoiceTableItem to filter correctly
                                      // Temporarily filtering by email - NEEDS FIX
                                      (inv) =>
                                        inv.customerEmail ===
                                        subItem.customerEmail
                                    );
                                  return subscriptionInvoices.length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Invoice ID</TableHead>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Status</TableHead>{" "}
                                          {/* Status might not be on InvoiceTableItem */}
                                          <TableHead className="text-right">
                                            Amount
                                          </TableHead>
                                          <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {subscriptionInvoices.map(
                                          (
                                            invoice: InvoiceTableItem,
                                            index: number // Add types
                                          ) => (
                                            <TableRow
                                              key={`${invoice.invoiceId}-${index}`}
                                            >
                                              <TableCell className="font-mono text-xs">
                                                {invoice.invoiceId}
                                              </TableCell>
                                              <TableCell>
                                                {invoice.formattedDate}
                                              </TableCell>
                                              <TableCell>
                                                {/* TODO: Need status on InvoiceTableItem or fetch raw invoice */}
                                                <Badge
                                                  className={
                                                    cn(/* Need status */)
                                                  }
                                                >
                                                  Paid{" "}
                                                  {/* Assuming paid, needs update */}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatCurrency(
                                                  invoice.totalAmount
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
                                                      `https://dashboard.stripe.com/invoices/${invoice.invoiceId}`,
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
                                {discounts[subItem.subscriptionId] ? (
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
                                                discounts[
                                                  subItem.subscriptionId
                                                ].coupon.id
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
                                        {/* Discount details display (using discounts map) */}
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-slate-500">
                                            Coupon:
                                          </dt>
                                          <dd className="text-sm font-mono">
                                            {
                                              discounts[subItem.subscriptionId]
                                                .coupon.id
                                            }
                                          </dd>
                                        </div>
                                        {/* ... other discount fields ... */}
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-slate-500">
                                            Discount Type:
                                          </dt>
                                          <dd className="text-sm">
                                            {discounts[subItem.subscriptionId]
                                              .coupon.percent_off
                                              ? `${
                                                  discounts[
                                                    subItem.subscriptionId
                                                  ].coupon.percent_off
                                                }% off`
                                              : formatCurrency(
                                                  discounts[
                                                    subItem.subscriptionId
                                                  ].coupon.amount_off || 0
                                                )}
                                          </dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-slate-500">
                                            Duration:
                                          </dt>
                                          <dd className="text-sm">
                                            {
                                              discounts[subItem.subscriptionId]
                                                .coupon.duration
                                            }
                                          </dd>
                                        </div>
                                        {discounts[subItem.subscriptionId]
                                          .coupon.duration_in_months && (
                                          <div className="flex justify-between">
                                            <dt className="text-sm text-slate-500">
                                              Duration (Months):
                                            </dt>
                                            <dd className="text-sm">
                                              {
                                                discounts[
                                                  subItem.subscriptionId
                                                ].coupon.duration_in_months
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
                                              discounts[subItem.subscriptionId]
                                                .start
                                            )}
                                          </dd>
                                        </div>
                                        {discounts[subItem.subscriptionId]
                                          .end && (
                                          <div className="flex justify-between">
                                            <dt className="text-sm text-slate-500">
                                              End Date:
                                            </dt>
                                            <dd className="text-sm">
                                              {formatDate(
                                                discounts[
                                                  subItem.subscriptionId
                                                ].end || undefined
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
                              <JsonDisplay data={rawSubscription} />
                            </TabsContent>
                          </Tabs>

                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() =>
                                window.open(
                                  `https://dashboard.stripe.com/subscriptions/${subItem.subscriptionId}`,
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

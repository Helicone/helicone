import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ExternalLink,
  TagIcon,
  PercentIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Subscription, StripeDiscount } from "@/lib/stripeUtils";

const JsonDisplay = ({ data }: { data: any }) => {
  return (
    <pre className="bg-slate-900 p-4 rounded-md text-xs overflow-auto max-h-[400px]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

// Helper functions
const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (
  amount: number,
  currency = "usd",
  options?: Intl.NumberFormatOptions
): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    ...options,
  });
  return formatter.format(amount / 100);
};

// Helper to get product name from product object or string
const getProductName = (product: any): string => {
  if (typeof product === "string") {
    return product;
  }
  return product?.name || product?.id || "Unknown Product";
};

// Type for MRR breakdown calculations
type MRRBreakdown = {
  total: number;
  discountAmount: number;
  hasDiscount: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
};

// Calculate detailed MRR for display
const calculateDetailedMRR = (subscription: Subscription): MRRBreakdown => {
  const total = subscription.totalMRR;
  const discountAmount = subscription.discountAmount;
  const hasDiscount = discountAmount > 0;

  // Find the primary discount to display
  let discountType: "percentage" | "fixed" | undefined;
  let discountValue: number | undefined;

  if (hasDiscount && subscription.discounts.length > 0) {
    const primaryDiscount = subscription.discounts[0];
    discountType = primaryDiscount.type;
    discountValue = primaryDiscount.amount;
  }

  return {
    total,
    discountAmount,
    hasDiscount,
    discountType,
    discountValue,
  };
};

export type SubscriptionTableProps = {
  subscriptions: Subscription[];
  isLoading?: boolean;
  error?: any;
  couponMap?: Record<string, StripeDiscount>;
};

const SubscriptionTable = ({
  subscriptions,
  isLoading = false,
  error = null,
  couponMap = {},
}: SubscriptionTableProps) => {
  const [sortField, setSortField] = useState<string>("mrr");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tierFilter, setTierFilter] = useState<string | null>(null);

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Calculate MRR details for each subscription
  const subscriptionsWithMrrDetails = useMemo(() => {
    return subscriptions.map((subscription) => {
      const mrrDetails = calculateDetailedMRR(subscription);
      return {
        ...subscription,
        mrrDetails,
      };
    });
  }, [subscriptions]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!subscriptionsWithMrrDetails) return [];

    let filtered = subscriptionsWithMrrDetails;

    // Apply tier filter if selected
    if (tierFilter) {
      filtered = filtered.filter((sub) =>
        tierFilter.startsWith("base:")
          ? sub.baseTier === tierFilter.replace("base:", "")
          : sub.tier === tierFilter
      );
    }

    // Sort data
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "mrr":
          comparison = a.mrrDetails.total - b.mrrDetails.total;
          break;
        case "tier":
          comparison = a.tier.localeCompare(b.tier);
          break;
        case "baseTier":
          comparison = a.baseTier.localeCompare(b.baseTier);
          break;
        case "createdAt":
          comparison = a.createdAt - b.createdAt;
          break;
        case "currentPeriodEnd":
          comparison = a.currentPeriodEnd - b.currentPeriodEnd;
          break;
        case "discount":
          comparison =
            (a.mrrDetails.discountAmount || 0) -
            (b.mrrDetails.discountAmount || 0);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [subscriptionsWithMrrDetails, sortField, sortDirection, tierFilter]);

  // Handler for sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Get unique tiers for filter dropdown
  const uniqueTiers = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      return { tiers: [] as string[], baseTiers: [] as string[] };
    }

    const tiers = new Set<string>();
    const baseTiers = new Set<string>();

    subscriptions.forEach((sub) => {
      tiers.add(sub.tier);
      baseTiers.add(sub.baseTier);
    });

    return {
      tiers: Array.from(tiers),
      baseTiers: Array.from(baseTiers),
    };
  }, [subscriptions]);

  if (isLoading) {
    return <div>Loading subscription data...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">Error loading data: {error.toString()}</div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return <div>No subscription data available</div>;
  }

  // Helper to render discount badge
  const renderDiscountBadge = (mrrDetails: MRRBreakdown) => {
    if (!mrrDetails.hasDiscount) return null;

    return (
      <div className="flex items-center text-amber-400 text-xs gap-1 mt-1">
        {mrrDetails.discountType === "percentage" ? (
          <PercentIcon size={12} />
        ) : (
          <TagIcon size={12} />
        )}
        <span>
          {mrrDetails.discountType === "percentage"
            ? `${mrrDetails.discountValue}% off`
            : formatCurrency(mrrDetails.discountValue || 0, "usd", {
                minimumFractionDigits: 0,
              })}{" "}
          off
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {tierFilter
                ? `Filter: ${
                    tierFilter.includes("base:")
                      ? tierFilter.replace("base:", "") + " (Base)"
                      : tierFilter
                  }`
                : "Filter by Tier"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTierFilter(null)}>
              Show All
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="opacity-50">
              Base Tiers
            </DropdownMenuItem>
            {uniqueTiers.baseTiers.map((tier) => (
              <DropdownMenuItem
                key={`base-${tier}`}
                onClick={() => setTierFilter(`base:${tier}`)}
              >
                {tier}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem disabled className="opacity-50">
              Specific Tiers
            </DropdownMenuItem>
            {uniqueTiers.tiers.map((tier) => (
              <DropdownMenuItem key={tier} onClick={() => setTierFilter(tier)}>
                {tier}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-slate-800 bg-slate-800">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-36">Subscription ID</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("tier")}
              >
                Tier
                {sortField === "tier" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("mrr")}
              >
                MRR
                {sortField === "mrr" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("discount")}
              >
                Discount
                {sortField === "discount" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("currentPeriodEnd")}
              >
                Period End
                {sortField === "currentPeriodEnd" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((subscription) => (
              <React.Fragment key={subscription.id}>
                <TableRow
                  className={`hover:bg-slate-700 ${
                    expanded[subscription.id] ? "border-b-0" : ""
                  }`}
                  onClick={() => toggleExpand(subscription.id)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(subscription.id);
                      }}
                    >
                      {expanded[subscription.id] ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {subscription.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{subscription.tier}</span>
                      <span className="text-xs text-muted-foreground">
                        Base: {subscription.baseTier}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {/* Display both base and final MRR if discounted */}
                    <div className="flex flex-col items-end">
                      {subscription.mrrDetails.hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(
                            subscription.mrrDetails.total +
                              subscription.mrrDetails.discountAmount
                          )}
                        </span>
                      )}
                      <span>
                        {formatCurrency(
                          subscription.mrrDetails.total,
                          undefined,
                          { maximumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderDiscountBadge(subscription.mrrDetails)}
                  </TableCell>
                  <TableCell>
                    {subscription.customerEmail || subscription.customerId}
                  </TableCell>
                  <TableCell>
                    {formatDate(subscription.currentPeriodEnd)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        subscription.cancelAtPeriodEnd
                          ? "bg-amber-800 text-amber-100"
                          : subscription.status === "active"
                          ? "bg-green-800 text-green-100"
                          : "bg-red-800 text-red-100"
                      }`}
                    >
                      {subscription.cancelAtPeriodEnd
                        ? "Canceling"
                        : subscription.status}
                    </span>
                  </TableCell>
                </TableRow>

                {expanded[subscription.id] && (
                  <TableRow className="bg-slate-800 hover:bg-slate-800">
                    <TableCell colSpan={8} className="p-0">
                      <div className="p-4">
                        <Tabs defaultValue="details">
                          <TabsList className="bg-slate-700">
                            <TabsTrigger value="details">
                              Subscription Details
                            </TabsTrigger>
                            <TabsTrigger value="items">Line Items</TabsTrigger>
                            <TabsTrigger value="discount">Discount</TabsTrigger>
                            <TabsTrigger value="metadata">Metadata</TabsTrigger>
                            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                          </TabsList>

                          <TabsContent value="details" className="mt-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-1">
                                  Dates
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Created:
                                    </span>{" "}
                                    {formatDate(subscription.createdAt)}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Current Period:
                                    </span>{" "}
                                    {formatDate(
                                      subscription.currentPeriodStart
                                    )}{" "}
                                    -{" "}
                                    {formatDate(subscription.currentPeriodEnd)}
                                  </div>
                                  {subscription.rawData.trial_start && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Trial:
                                      </span>{" "}
                                      {formatDate(
                                        subscription.rawData.trial_start
                                      )}{" "}
                                      -{" "}
                                      {formatDate(
                                        subscription.rawData.trial_end || 0
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium mb-1">
                                  Billing
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Currency:
                                    </span>{" "}
                                    {subscription.rawData.currency?.toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Collection Method:
                                    </span>{" "}
                                    {subscription.rawData.collection_method}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Billing Anchor:
                                    </span>{" "}
                                    {formatDate(
                                      subscription.rawData
                                        .billing_cycle_anchor || 0
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium mb-1">
                                  Status
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Status:
                                    </span>{" "}
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        subscription.status === "active"
                                          ? "bg-green-800 text-green-100"
                                          : "bg-red-800 text-red-100"
                                      }`}
                                    >
                                      {subscription.status}
                                    </span>
                                  </div>
                                  {subscription.cancelAtPeriodEnd && (
                                    <div>
                                      <span className="text-red-500">
                                        Cancels at period end
                                      </span>
                                    </div>
                                  )}
                                  {subscription.rawData.canceled_at && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Canceled At:
                                      </span>{" "}
                                      {formatDate(
                                        subscription.rawData.canceled_at
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="items" className="mt-4">
                            <div className="rounded-md border border-slate-700">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-800 hover:bg-slate-800">
                                    <TableHead>ID</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {subscription.items.map((item) => (
                                    <TableRow
                                      key={item.id}
                                      className="hover:bg-slate-700"
                                    >
                                      <TableCell className="font-mono text-xs">
                                        {item.id}
                                      </TableCell>
                                      <TableCell>{item.productName}</TableCell>
                                      <TableCell>
                                        {formatCurrency(item.price.unitAmount)}/
                                        {item.price.interval}
                                        {item.price.intervalCount > 1 &&
                                          `*${item.price.intervalCount}`}
                                      </TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>
                                        {item.discountAmount > 0 ? (
                                          <span className="text-amber-400">
                                            {formatCurrency(
                                              item.discountAmount
                                            )}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {formatCurrency(item.mrr)}
                                        <span className="text-xs text-muted-foreground ml-1">
                                          /month
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>

                          <TabsContent value="discount" className="mt-4">
                            {subscription.discounts.length > 0 ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">
                                      Discount Details
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      {subscription.discounts.map(
                                        (discount, idx) => (
                                          <div
                                            key={discount.id}
                                            className="p-2 bg-slate-700 rounded-md mb-2"
                                          >
                                            <h5 className="font-medium mb-1">
                                              Discount {idx + 1}
                                            </h5>
                                            <div>
                                              <span className="text-muted-foreground">
                                                ID:
                                              </span>{" "}
                                              <code className="font-mono text-xs">
                                                {discount.id}
                                              </code>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">
                                                Type:
                                              </span>{" "}
                                              {discount.type === "percentage"
                                                ? "Percentage"
                                                : "Fixed Amount"}
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">
                                                Value:
                                              </span>{" "}
                                              {discount.type === "percentage"
                                                ? `${discount.amount}%`
                                                : formatCurrency(
                                                    discount.amount * 100
                                                  )}
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">
                                                Duration:
                                              </span>{" "}
                                              {discount.duration}
                                              {discount.duration ===
                                                "repeating" &&
                                                ` (${discount.durationInMonths} months)`}
                                            </div>
                                            {discount.validUntil && (
                                              <div>
                                                <span className="text-muted-foreground">
                                                  Valid Until:
                                                </span>{" "}
                                                {formatDate(
                                                  discount.validUntil
                                                )}
                                              </div>
                                            )}
                                            {discount.appliesTo && (
                                              <div>
                                                <span className="text-muted-foreground">
                                                  Applies To:
                                                </span>{" "}
                                                {discount.appliesTo.productIds
                                                  .length > 0
                                                  ? discount.appliesTo.productIds.join(
                                                      ", "
                                                    )
                                                  : "All products"}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-medium mb-1">
                                      Discount Summary
                                    </h4>
                                    <div className="bg-slate-700 p-4 rounded-md">
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span>Base MRR:</span>
                                          <span>
                                            {formatCurrency(
                                              subscription.baseMRR
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-amber-400">
                                          <span>Discount:</span>
                                          <span>
                                            -{" "}
                                            {formatCurrency(
                                              subscription.discountAmount
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t border-slate-600 pt-1">
                                          <span>Final MRR:</span>
                                          <span>
                                            {formatCurrency(
                                              subscription.totalMRR
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-sm">
                                No discounts applied to this subscription
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="metadata" className="mt-4">
                            {subscription.rawData.metadata &&
                            Object.keys(subscription.rawData.metadata).length >
                              0 ? (
                              <div className="rounded-md border border-slate-700">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-slate-800 hover:bg-slate-800">
                                      <TableHead>Key</TableHead>
                                      <TableHead>Value</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {Object.entries(
                                      subscription.rawData.metadata
                                    ).map(([key, value]) => (
                                      <TableRow
                                        key={key}
                                        className="hover:bg-slate-700"
                                      >
                                        <TableCell>{key}</TableCell>
                                        <TableCell>
                                          {typeof value === "string"
                                            ? value
                                            : JSON.stringify(value)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-sm">
                                No metadata found
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="raw" className="mt-4">
                            <JsonDisplay data={subscription.rawData} />
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs bg-slate-700 hover:bg-slate-600 border-slate-600"
                            onClick={() => {
                              window.open(
                                `https://dashboard.stripe.com/subscriptions/${subscription.id}`,
                                "_blank"
                              );
                            }}
                          >
                            View in Stripe Dashboard
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground mt-2">
        Showing {filteredAndSortedData.length} of {subscriptions.length}{" "}
        subscriptions
      </div>
    </>
  );
};

export default SubscriptionTable;

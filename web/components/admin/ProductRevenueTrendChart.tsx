import React, { useMemo } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, TooltipProps } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SubscriptionAnalytics } from "@/lib/SubscriptionAnalytics";
import { TrendingUp, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface ProductRevenueTrendChartProps {
  productId: string | string[];
  productName?: string;
  analytics: SubscriptionAnalytics;
}

// Define types for debug data
interface InvoiceItem {
  invoiceId: string;
  subscriptionId?: string;
  amount: number;
  quantity: number;
  lineAmount: number;
  date: number;
  description: string;
  customerName: string;
  customerEmail: string;
}

interface UpcomingInvoiceItem {
  subscriptionId: string;
  amount: number;
  quantity: number;
  unitAmount: number;
  date: number;
  description: string;
  customerName: string;
  customerEmail: string;
  isMetered: boolean;
  usageType: string;
  period: { start: number; end: number } | null;
  discountApplied?: boolean;
  discountPercent?: number;
  discountAmount?: number;
  originalAmount?: number;
  discountedAmount?: number;
  isCredit?: boolean;
}

interface SubscriptionItem {
  subscriptionId: string;
  amount: number;
  quantity: number;
  mrr: number;
  discountedMrr?: number;
  nextBillingDate: number;
  customerName: string;
  customerEmail: string;
  productName: string;
  interval: string;
  discount: number;
  appliedDiscount?: boolean;
  isMetered?: boolean;
  status?: string;
  cancelAtPeriodEnd?: boolean;
}

interface DebugData {
  invoices: Record<string, Record<string, InvoiceItem[]>>;
  subscriptions: Record<string, Record<string, SubscriptionItem[]>>;
  upcomingInvoices: Record<string, Record<string, UpcomingInvoiceItem[]>>;
}

// Custom tooltip component that includes totals
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // Calculate total
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="rounded-lg border border-border bg-card text-card-foreground p-2 shadow-sm">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div
            key={`tooltip-${index}`}
            className="flex justify-between text-sm"
          >
            <span className="mr-4 text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              ${Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="mt-1 pt-1 border-t border-border">
          <div className="flex justify-between text-sm font-semibold">
            <span className="mr-4">Total:</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Add a helper function to truncate subscription IDs
const truncateSubscriptionId = (subscriptionId: string) => {
  if (!subscriptionId) return "";
  if (subscriptionId.length <= 12) return subscriptionId;

  // Extract last 4 characters
  const lastPart = subscriptionId.slice(-4);
  return `sub_...${lastPart}`;
};

// Add helper function to truncate invoice IDs
const truncateInvoiceId = (invoiceId: string) => {
  if (!invoiceId) return "";
  if (invoiceId.length <= 12) return invoiceId;

  // Extract last 4 characters
  const lastPart = invoiceId.slice(-4);
  return `in_...${lastPart}`;
};

// Add a helper function to truncate email addresses
const truncateEmail = (email: string) => {
  if (!email) return "Unknown";
  if (email.length <= 20) return email;

  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email.substring(0, 17) + "...";

  // Keep domain part and truncate username if needed
  const username = email.substring(0, atIndex);
  const domain = email.substring(atIndex);

  if (username.length <= 10) return email;
  return username.substring(0, 7) + "..." + domain;
};

const ProductRevenueTrendChart: React.FC<ProductRevenueTrendChartProps> = ({
  productId,
  productName,
  analytics,
}) => {
  // Add state for tracking which ID was just copied
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    });
  };

  // Generate chart data and debug info from the subscription analytics
  const { chartData, debugData } = useMemo(() => {
    // Get the MRR data for this product over the last 6 months
    const productIds = Array.isArray(productId) ? productId : [productId];
    const response = analytics.getMRRChartData({
      months: 6,
      productIds: productIds,
    });

    // Transform the data into the format expected by the chart
    const monthData = Object.entries(response.data)
      .map(([month, products]) => {
        let monthActual = 0;
        let monthProjected = 0;

        // Sum up data from all products
        productIds.forEach((id) => {
          const productData = products[id] || { actual: 0, projected: 0 };
          monthActual += productData.actual;
          monthProjected += productData.projected;
        });

        // Convert from cents to dollars
        const actualRevenue = Math.round(monthActual / 100);
        const projectedRevenue = Math.round(monthProjected / 100);

        // Explicitly parse the month string to ensure consistent date handling
        const dateParts = month.split("-");
        const year = parseInt(dateParts[0]);
        const monthIndex = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
        const dateObj = new Date(year, monthIndex, 1);

        return {
          month: dateObj.toLocaleString("default", { month: "short" }),
          actual: actualRevenue,
          projected: projectedRevenue,
          total: actualRevenue + projectedRevenue,
          date: dateObj, // Keep date for sorting
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort chronologically
      .map(({ month, actual, projected, total }) => ({
        month,
        actual,
        projected,
        total,
      })); // Remove date after sorting

    return {
      chartData: monthData,
      debugData: response.debug as DebugData,
    };
  }, [productId, analytics]);

  // Find the product name if not provided
  const displayName = useMemo(() => {
    // Use the provided product name if available
    if (productName) return productName;

    // If multiple products, show "Combined Products"
    if (Array.isArray(productId) && productId.length > 1) {
      return `Combined Products (${productId.length})`;
    }

    // Otherwise, use the product ID as a fallback
    const singleId = Array.isArray(productId) ? productId[0] : productId;
    return `Product ${singleId.replace("prod_", "")}`;
  }, [productId, productName]);

  // Chart configuration
  const chartConfig = {
    actual: {
      label: "Billed Revenue",
      color: "#2A9D90",
    },
    projected: {
      label: "Projected Revenue",
      color: "#E76E50",
    },
  } satisfies ChartConfig;

  // Calculate trending percentage
  const trendingPercentage = useMemo(() => {
    if (chartData.length < 2) return "0";

    const currentMonth = chartData[chartData.length - 1].total;
    const previousMonth = chartData[chartData.length - 2].total;

    if (previousMonth === 0) return "0";

    return (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1);
  }, [chartData]);

  const isTrendingUp = parseFloat(trendingPercentage) >= 0;

  // Calculate total MRR for current month
  const currentMRR =
    chartData.length > 0 ? chartData[chartData.length - 1].total : 0;

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Helper function to create subscription link
  const getSubscriptionLink = (subscriptionId: string) => {
    return `https://dashboard.stripe.com/subscriptions/${subscriptionId}`;
  };

  // Helper function to create invoice link
  const getInvoiceLink = (invoiceId: string) => {
    return `https://dashboard.stripe.com/invoices/${invoiceId}`;
  };

  // Check if invoices exist for this product
  const hasInvoiceData = useMemo(() => {
    if (!debugData?.invoices) return false;

    const productIds = Array.isArray(productId) ? productId : [productId];

    return Object.values(debugData.invoices).some((products) =>
      productIds.some((id) => products[id] && products[id].length > 0)
    );
  }, [debugData, productId]);

  // Check if subscriptions exist for this product
  const hasSubscriptionData = useMemo(() => {
    if (!debugData?.subscriptions) return false;

    const productIds = Array.isArray(productId) ? productId : [productId];

    return Object.values(debugData.subscriptions).some((products) =>
      productIds.some((id) => products[id] && products[id].length > 0)
    );
  }, [debugData, productId]);

  // Check if upcoming invoices exist for this product
  const hasUpcomingInvoiceData = useMemo(() => {
    if (!debugData?.upcomingInvoices) return false;

    const productIds = Array.isArray(productId) ? productId : [productId];

    return Object.values(debugData.upcomingInvoices).some((products) =>
      productIds.some((id) => products[id] && products[id].length > 0)
    );
  }, [debugData, productId]);

  // For multiple products, we'll flatten the debug data
  const flattenedDebugData = useMemo(() => {
    if (!Array.isArray(productId) || productId.length <= 1) {
      return debugData;
    }

    const result: DebugData = {
      invoices: {},
      subscriptions: {},
      upcomingInvoices: {},
    };

    // Flatten invoices
    if (debugData?.invoices) {
      Object.entries(debugData.invoices).forEach(([month, products]) => {
        result.invoices[month] = result.invoices[month] || {};
        result.invoices[month]["combined"] = [];

        productId.forEach((id) => {
          if (products[id]) {
            result.invoices[month]["combined"].push(...products[id]);
          }
        });
      });
    }

    // Flatten subscriptions
    if (debugData?.subscriptions) {
      Object.entries(debugData.subscriptions).forEach(([month, products]) => {
        result.subscriptions[month] = result.subscriptions[month] || {};
        result.subscriptions[month]["combined"] = [];

        productId.forEach((id) => {
          if (products[id]) {
            result.subscriptions[month]["combined"].push(...products[id]);
          }
        });
      });
    }

    // Flatten upcoming invoices
    if (debugData?.upcomingInvoices) {
      Object.entries(debugData.upcomingInvoices).forEach(
        ([month, products]) => {
          result.upcomingInvoices[month] = result.upcomingInvoices[month] || {};
          result.upcomingInvoices[month]["combined"] = [];

          productId.forEach((id) => {
            if (products[id]) {
              result.upcomingInvoices[month]["combined"].push(...products[id]);
            }
          });
        }
      );
    }

    return result;
  }, [debugData, productId]);

  const effectiveDebugData =
    Array.isArray(productId) && productId.length > 1
      ? flattenedDebugData
      : debugData;

  const effectiveProductId =
    Array.isArray(productId) && productId.length > 1
      ? "combined"
      : Array.isArray(productId)
      ? productId[0]
      : productId;

  return (
    <Card>
      <style jsx>{`
        :global(:root) {
          --color-actual: #2a9d90;
          --color-projected: #e76e50;
        }
      `}</style>
      <CardHeader>
        <CardTitle>{displayName} Revenue</CardTitle>
        <CardDescription>
          Monthly revenue trend for the last 6 months
          {Array.isArray(productId) && productId.length > 1 && (
            <span className="block text-xs text-muted-foreground mt-1">
              Combined total for {productId.length} products
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-2xl font-bold">${currentMRR.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            Current Monthly Revenue
          </p>
        </div>

        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="subscriptions">Subs</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <ChartContainer
              config={chartConfig}
              className="min-h-[200px] w-full"
            >
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip content={<CustomTooltip />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="actual" stackId="a" fill="var(--color-actual)" />
                <Bar
                  dataKey="projected"
                  stackId="a"
                  fill="var(--color-projected)"
                />
              </BarChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="upcoming">
            <div className="border rounded-md p-4 overflow-auto max-h-[400px]">
              <h3 className="font-medium mb-2">
                Upcoming Invoices (Projected Revenue)
              </h3>
              {effectiveDebugData?.upcomingInvoices ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Customer Email</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Only proceed if we have data
                      if (!effectiveDebugData?.upcomingInvoices) {
                        return null;
                      }

                      const allItems: UpcomingInvoiceItem[] = [];

                      // Flatten all items from all months
                      Object.entries(
                        effectiveDebugData.upcomingInvoices
                      ).forEach(([month, products]) => {
                        const items = products[effectiveProductId] || [];
                        allItems.push(...items);
                      });

                      // Filter to only show items from current month
                      const currentDate = new Date();
                      const currentMonth = `${currentDate.getFullYear()}-${String(
                        currentDate.getMonth() + 1
                      ).padStart(2, "0")}`;

                      const currentMonthItems = allItems.filter((item) => {
                        // If the item has period information, use that
                        if (item.period && item.period.start) {
                          const periodStart = new Date(item.period.start);
                          const itemMonth = `${periodStart.getFullYear()}-${String(
                            periodStart.getMonth() + 1
                          ).padStart(2, "0")}`;
                          return itemMonth === currentMonth;
                        }

                        // Fall back to the due date, but be inclusive of this month's charges
                        const dueDate = new Date(item.date);
                        const dueMonth = `${dueDate.getFullYear()}-${String(
                          dueDate.getMonth() + 1
                        ).padStart(2, "0")}`;
                        return dueMonth <= currentMonth;
                      });

                      // Group by subscription ID only
                      const groupedBySubscription: {
                        [key: string]: UpcomingInvoiceItem[];
                      } = {};

                      currentMonthItems.forEach((item) => {
                        const subId = item.subscriptionId || "";

                        if (!groupedBySubscription[subId]) {
                          groupedBySubscription[subId] = [];
                        }

                        groupedBySubscription[subId].push(item);
                      });

                      // Process subscription groups into display items
                      const displayItems = Object.entries(
                        groupedBySubscription
                      ).map(([subId, items]) => {
                        // Get original amount (pre-discount)
                        const originalAmount = items.reduce((sum, item) => {
                          const itemAmount =
                            typeof item.amount === "number" ? item.amount : 0;
                          return sum + itemAmount;
                        }, 0);

                        // Get discounted amount (post-discount)
                        const discountedAmount = items.reduce((sum, item) => {
                          // Use the discountedAmount if available, otherwise fallback to amount
                          const adjustedAmount =
                            item.discountedAmount !== undefined
                              ? item.discountedAmount
                              : typeof item.amount === "number"
                              ? item.amount
                              : 0;
                          return sum + adjustedAmount;
                        }, 0);

                        // Customer info from the first item
                        const customerEmail =
                          items[0]?.customerEmail || "Unknown";
                        const date = items[0]?.date || 0;

                        // Get a preview of the descriptions
                        const descriptionsPreview = items
                          .map((i) => i.description || "")
                          .join(", ");
                        const truncatedDescriptions =
                          descriptionsPreview.length > 50
                            ? descriptionsPreview.substring(0, 50) + "..."
                            : descriptionsPreview;

                        return {
                          subId,
                          originalAmount,
                          discountedAmount,
                          items,
                          customerEmail,
                          date,
                          descriptionsPreview: truncatedDescriptions,
                        };
                      });

                      // Filter out items with zero discounted amount and sort by original amount
                      const filteredAndSorted = displayItems
                        .filter((item) => item.discountedAmount > 0)
                        .sort((a, b) => b.originalAmount - a.originalAmount);

                      // Render the rows
                      return filteredAndSorted.map((data, idx) => (
                        <TableRow key={`sub-${data.subId}-${idx}`}>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <a
                                href={getSubscriptionLink(data.subId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                                title={data.subId}
                              >
                                {truncateSubscriptionId(data.subId)}
                              </a>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  copyToClipboard(data.subId);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-sm focus:outline-none"
                                title="Copy subscription ID"
                              >
                                {copiedId === data.subId ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            ${(data.originalAmount / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span
                                title={data.customerEmail}
                                className="cursor-pointer hover:text-primary"
                                onClick={() =>
                                  copyToClipboard(data.customerEmail)
                                }
                              >
                                {truncateEmail(data.customerEmail)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  copyToClipboard(data.customerEmail);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-sm focus:outline-none"
                                title="Copy email address"
                              >
                                {copiedId === data.customerEmail ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(data.date)}</TableCell>
                        </TableRow>
                      ));
                    })()}
                    {!hasUpcomingInvoiceData && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No upcoming invoice data found for this product
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No upcoming invoice data available
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="border rounded-md p-4 overflow-auto max-h-[400px]">
              <h3 className="font-medium mb-2">
                Invoice Data (Billed Revenue)
              </h3>
              {effectiveDebugData?.invoices ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Customer Email</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(effectiveDebugData.invoices).map(
                      ([month, products]) => {
                        const items = products[effectiveProductId] || [];

                        // Group items by subscription ID
                        const groupedBySubscription: {
                          [key: string]: {
                            invoiceId: string;
                            totalAmount: number;
                            customerEmail: string;
                            date: number;
                          };
                        } = {};

                        items.forEach((item: InvoiceItem) => {
                          const subId = item.subscriptionId || "unknown";

                          if (!groupedBySubscription[subId]) {
                            groupedBySubscription[subId] = {
                              invoiceId: item.invoiceId,
                              totalAmount: 0,
                              customerEmail: item.customerEmail,
                              date: item.date,
                            };
                          }

                          // Add the line amount to the total
                          groupedBySubscription[subId].totalAmount += Math.abs(
                            item.lineAmount
                          );
                        });

                        // Convert to array and sort by total amount
                        const combinedItems = Object.values(
                          groupedBySubscription
                        )
                          .filter((item) => item.totalAmount > 0)
                          .sort((a, b) => b.totalAmount - a.totalAmount);

                        return combinedItems.map((item, idx: number) => (
                          <TableRow key={`${month}-${item.invoiceId}-${idx}`}>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <a
                                  href={getInvoiceLink(item.invoiceId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                  title={item.invoiceId}
                                >
                                  {truncateInvoiceId(item.invoiceId)}
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    copyToClipboard(item.invoiceId);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded-sm focus:outline-none"
                                  title="Copy invoice ID"
                                >
                                  {copiedId === item.invoiceId ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              ${(item.totalAmount / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <span
                                  title={item.customerEmail}
                                  className="cursor-pointer hover:text-primary"
                                  onClick={() =>
                                    copyToClipboard(item.customerEmail)
                                  }
                                >
                                  {truncateEmail(item.customerEmail)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    copyToClipboard(item.customerEmail);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded-sm focus:outline-none"
                                  title="Copy email address"
                                >
                                  {copiedId === item.customerEmail ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(item.date)}</TableCell>
                          </TableRow>
                        ));
                      }
                    )}
                    {!hasInvoiceData && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No invoice data found for this product
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No invoice data available
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="border rounded-md p-4 overflow-auto max-h-[400px]">
              <h3 className="font-medium mb-2">
                Subscription Data (Projected Revenue)
              </h3>
              {effectiveDebugData?.subscriptions ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Final MRR</TableHead>
                      <TableHead>Customer Email</TableHead>
                      <TableHead>Next Billing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(effectiveDebugData.subscriptions).map(
                      ([month, products]) => {
                        const items = products[effectiveProductId] || [];
                        // Sort items by mrr descending (highest first)
                        const sortedItems = [...items].sort((a, b) => {
                          const aMrr =
                            a.discountedMrr !== undefined
                              ? a.discountedMrr
                              : a.mrr;
                          const bMrr =
                            b.discountedMrr !== undefined
                              ? b.discountedMrr
                              : b.mrr;
                          return bMrr - aMrr;
                        });

                        return sortedItems.map(
                          (item: SubscriptionItem, idx: number) => (
                            <TableRow
                              key={`${month}-${item.subscriptionId}-${idx}`}
                            >
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <a
                                    href={getSubscriptionLink(
                                      item.subscriptionId
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                    title={item.subscriptionId}
                                  >
                                    {truncateSubscriptionId(
                                      item.subscriptionId
                                    )}
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      copyToClipboard(item.subscriptionId);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded-sm focus:outline-none"
                                    title="Copy subscription ID"
                                  >
                                    {copiedId === item.subscriptionId ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-gray-500" />
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell>
                                ${(item.amount / 100).toFixed(2)}
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                {item.discount > 0 ? (
                                  <span className="text-green-600 font-medium">
                                    {item.discount}%
                                  </span>
                                ) : (
                                  "None"
                                )}
                              </TableCell>
                              <TableCell>
                                $
                                {(
                                  (item.discountedMrr !== undefined
                                    ? item.discountedMrr
                                    : item.mrr) / 100
                                ).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <span
                                    title={item.customerEmail}
                                    className="cursor-pointer hover:text-primary"
                                    onClick={() =>
                                      copyToClipboard(item.customerEmail)
                                    }
                                  >
                                    {truncateEmail(item.customerEmail)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      copyToClipboard(item.customerEmail);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded-sm focus:outline-none"
                                    title="Copy email address"
                                  >
                                    {copiedId === item.customerEmail ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-gray-500" />
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDate(item.nextBillingDate)}
                              </TableCell>
                            </TableRow>
                          )
                        );
                      }
                    )}
                    {!hasSubscriptionData && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No subscription data found for this product
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No subscription data available
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {isTrendingUp ? "Trending up" : "Trending down"} by{" "}
          {Math.abs(parseFloat(trendingPercentage))}% this month
          {isTrendingUp ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingUp className="h-4 w-4 rotate-180" />
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductRevenueTrendChart;

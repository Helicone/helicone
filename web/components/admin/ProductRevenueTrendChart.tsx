import React, { useState, useMemo } from "react";
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
// Import the specific types needed for props
import {
  RevenueChartDataPoint,
  InvoiceTableItem,
  SubscriptionTableItem,
  UpcomingInvoiceTableItem,
} from "@/lib/admin/RevenueCalculator";
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
import {
  getInvoiceLink,
  getSubscriptionLink,
  truncateEmail,
  truncateInvoiceId,
  truncateSubscriptionId,
} from "@/lib/uiUtils";

// Define props for the simplified component
interface ProductRevenueTrendChartProps {
  productName?: string;
  chartData: RevenueChartDataPoint[];
  invoiceTableData: InvoiceTableItem[];
  upcomingInvoiceTableData: UpcomingInvoiceTableItem[];
  subscriptionTableData: SubscriptionTableItem[];
  currentMRR: number;
  trendingPercentage: { percentage: string; isUp: boolean };
}

// Custom tooltip component (remains the same)
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
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

// Simplified Chart Component
const ProductRevenueTrendChart: React.FC<ProductRevenueTrendChartProps> = ({
  productName,
  chartData,
  invoiceTableData,
  upcomingInvoiceTableData,
  subscriptionTableData,
  currentMRR,
  trendingPercentage,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const { percentage: trendPercent, isUp: isTrendingUp } = trendingPercentage;

  // Chart configuration (can be defined directly)
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

  const hasInvoiceData = invoiceTableData.length > 0;
  const hasSubscriptionData = subscriptionTableData.length > 0;
  const hasUpcomingInvoiceData = upcomingInvoiceTableData.length > 0;

  return (
    <Card>
      <style jsx>{`
        :global(:root) {
          --color-actual: #2a9d90;
          --color-projected: #e76e50;
        }
      `}</style>
      <CardHeader>
        <CardTitle>{productName || "Product Revenue"} Revenue</CardTitle>
        <CardDescription>
          Monthly revenue trend for the last 6 months
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
                  tickFormatter={(value) => value.slice(0, 3)} // Assuming month is short name
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

          {/* Render tables using the pre-calculated props */}
          <TabsContent value="upcoming">
            <div className="border rounded-md p-4 overflow-auto max-h-[400px]">
              <h3 className="font-medium mb-2">
                Upcoming Invoices (Projected Revenue)
              </h3>
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
                  {upcomingInvoiceTableData.map((item, idx) => (
                    <TableRow key={`sub-${item.subscriptionId}-${idx}`}>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <a
                            href={getSubscriptionLink(item.subscriptionId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            title={item.subscriptionId}
                          >
                            {truncateSubscriptionId(item.subscriptionId)}
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
                        {/* Display original amount, could also show discounted */}
                        ${(item.originalAmount / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span
                            title={item.customerEmail}
                            className="cursor-pointer hover:text-primary"
                            onClick={() => copyToClipboard(item.customerEmail)}
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
                      <TableCell>{item.formattedDate}</TableCell>
                    </TableRow>
                  ))}
                  {!hasUpcomingInvoiceData && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No upcoming invoice data found for this product this
                        month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="border rounded-md p-4 overflow-auto max-h-[400px]">
              <h3 className="font-medium mb-2">
                Invoice Data (Billed Revenue)
              </h3>
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
                  {invoiceTableData.map((item, idx) => (
                    <TableRow key={`invoice-${item.invoiceId}-${idx}`}>
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
                            onClick={() => copyToClipboard(item.customerEmail)}
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
                      <TableCell>{item.formattedDate}</TableCell>
                    </TableRow>
                  ))}
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
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="border rounded-md p-4 overflow-auto max-h-[400px]">
              <h3 className="font-medium mb-2">Subscription Data</h3>
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
                  {subscriptionTableData.map((item, idx) => (
                    <TableRow key={`sub-${item.subscriptionId}-${idx}`}>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <a
                            href={getSubscriptionLink(item.subscriptionId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            title={item.subscriptionId}
                          >
                            {truncateSubscriptionId(item.subscriptionId)}
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
                      <TableCell>${(item.amount / 100).toFixed(2)}</TableCell>
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
                            onClick={() => copyToClipboard(item.customerEmail)}
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
                      <TableCell>{item.formattedNextBillingDate}</TableCell>
                    </TableRow>
                  ))}
                  {!hasSubscriptionData && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No subscription data found for this product
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {isTrendingUp ? "Trending up" : "Trending down"} by{" "}
          {Math.abs(parseFloat(trendPercent))}% this month
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

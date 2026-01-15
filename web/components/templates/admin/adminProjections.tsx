import { InvoiceTable, SortConfig } from "@/components/admin/InvoiceTable";
import {
  MOCK_DISCOUNTS,
  MOCK_INVOICES,
  MOCK_UPCOMING_INVOICES,
} from "@/components/layout/admin/mockStripeData";
import {
  InvoiceData,
  MonthlyRevenueData,
  RawStripeData,
  RevenueCalculator,
} from "@/lib/admin/RevenueCalculator";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { formatMonthKey } from "@/lib/uiUtils";
import { logger } from "@/lib/telemetry/logger";
import { useEffect, useMemo, useState } from "react";
import type Stripe from "stripe";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { H1, H2, H3, Small, Muted } from "@/components/ui/typography";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Type for the API response
interface SubscriptionDataResponse {
  data: {
    subscriptions: Stripe.Subscription[];
    invoices: Stripe.Invoice[];
    discounts: Record<string, Stripe.Discount>;
    upcomingInvoices: Stripe.UpcomingInvoice[];
  };
  error?: string;
}

// Modal component for displaying raw invoice data
const InvoiceModal = ({
  isOpen,
  invoice,
  onClose,
}: {
  isOpen: boolean;
  invoice: any;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[80vh] w-full max-w-4xl flex-col rounded-lg border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border p-4">
          <H3>Raw Invoice Data</H3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex-grow overflow-auto p-4">
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">
            {JSON.stringify(invoice, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Chart data transformation
interface ChartDataItem {
  month: string;
  monthKey: string;
  billed: number;
  upcoming: number;
  total: number;
}

function transformInvoiceData(
  billedInvoices: InvoiceData[],
  upcomingInvoices: InvoiceData[],
  months: number
): ChartDataItem[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - (months - 1));

  const monthBuckets: Record<string, ChartDataItem> = {};

  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthName = date.toLocaleString("default", { month: "short" });

    monthBuckets[monthKey] = {
      month: monthName,
      monthKey,
      billed: 0,
      upcoming: 0,
      total: 0,
    };
  }

  billedInvoices.forEach((invoice) => {
    const date = invoice.created;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthBuckets[monthKey]) {
      monthBuckets[monthKey].billed += invoice.amountAfterProcessing;
      monthBuckets[monthKey].total += invoice.amountAfterProcessing;
    }
  });

  const currentMonthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`;
  upcomingInvoices.forEach((invoice) => {
    if (monthBuckets[currentMonthKey]) {
      monthBuckets[currentMonthKey].upcoming += invoice.amountAfterProcessing;
      monthBuckets[currentMonthKey].total += invoice.amountAfterProcessing;
    }
  });

  return Object.values(monthBuckets).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey)
  );
}

// Compact Revenue Chart Cell (no card wrapper)
const RevenueChartCell = ({
  productName,
  billedInvoices,
  upcomingInvoices,
  isHighlighted,
  isOld,
}: {
  productName: string;
  billedInvoices: InvoiceData[];
  upcomingInvoices: InvoiceData[];
  isHighlighted?: boolean;
  isOld?: boolean;
}) => {
  const chartData = useMemo(
    () => transformInvoiceData(billedInvoices, upcomingInvoices, 6),
    [billedInvoices, upcomingInvoices]
  );

  // Current month totals (last item in chartData)
  const currentMonth = chartData[chartData.length - 1];
  const currentMonthBilled = currentMonth?.billed || 0;
  const currentMonthUpcoming = currentMonth?.upcoming || 0;
  const currentMonthTotal = currentMonthBilled + currentMonthUpcoming;

  const previousMonth = chartData[chartData.length - 2];
  const trend =
    previousMonth && previousMonth.total > 0
      ? ((currentMonthTotal - previousMonth.total) / previousMonth.total) * 100
      : null;

  return (
    <div
      className={cn(
        "p-4",
        isHighlighted && "bg-primary/5",
        isOld && "opacity-60"
      )}
    >
      {/* Header with revenue */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Small className={cn("font-semibold", isOld && "text-muted-foreground")}>
            {productName}
          </Small>
          {trend !== null && (
            <div className="flex items-center gap-0.5">
              {trend >= 0 ? (
                <TrendingUp size={10} className="text-green-500" />
              ) : (
                <TrendingDown size={10} className="text-red-500" />
              )}
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  trend >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {Math.abs(trend).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold tabular-nums">
            ${currentMonthTotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            ${currentMonthBilled.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            {currentMonthUpcoming > 0 && (
              <span className="text-green-600"> +${currentMonthUpcoming.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            )}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[140px] w-full">
        <ChartContainer
          config={{
            billed: {
              label: "Billed",
              color: "hsl(200 90% 50%)",
            },
            upcoming: {
              label: "Upcoming",
              color: "hsla(142, 76%, 36%, 0.4)",
            },
          }}
          className="h-full w-full"
        >
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="15%"
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.15}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={6}
              axisLine={false}
              fontSize={9}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  valueFormatter={(value) =>
                    `$${(value as number).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
                  }
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0]?.payload as ChartDataItem;
                      const total = data?.total || 0;
                      return `${label} — $${total.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
                    }
                    return label;
                  }}
                />
              }
            />
            <Bar
              dataKey="billed"
              stackId="a"
              fill="var(--color-billed)"
              radius={0}
            />
            <Bar
              dataKey="upcoming"
              stackId="a"
              fill="var(--color-upcoming)"
              radius={0}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};

// Deposit chart data type
interface DepositDataPoint {
  timestamp: string;
  amount: number;
}

// Deposit Chart Cell Component
const DepositChartCell = ({
  deposits,
  isLoading,
}: {
  deposits: DepositDataPoint[];
  isLoading?: boolean;
}) => {
  const chartData = useMemo(() => {
    // Create 6 month buckets
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 5);

    const monthBuckets: Record<string, ChartDataItem> = {};

    for (let i = 0; i < 6; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleString("default", { month: "short" });

      monthBuckets[monthKey] = {
        month: monthName,
        monthKey,
        billed: 0,
        upcoming: 0,
        total: 0,
      };
    }

    // Fill in deposit data
    deposits.forEach((d) => {
      const date = new Date(d.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthBuckets[monthKey]) {
        monthBuckets[monthKey].billed += d.amount;
        monthBuckets[monthKey].total += d.amount;
      }
    });

    return Object.values(monthBuckets).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );
  }, [deposits]);

  const currentMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];
  const currentMonthTotal = currentMonth?.total || 0;
  const trend =
    previousMonth && previousMonth.total > 0
      ? ((currentMonthTotal - previousMonth.total) / previousMonth.total) * 100
      : null;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-[180px]">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with amount */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <Small className="font-semibold">Deposits</Small>
            <Muted className="text-[10px]">(not in All Products)</Muted>
          </div>
          {trend !== null && (
            <div className="flex items-center gap-0.5">
              {trend >= 0 ? (
                <TrendingUp size={10} className="text-green-500" />
              ) : (
                <TrendingDown size={10} className="text-red-500" />
              )}
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  trend >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {Math.abs(trend).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold tabular-nums">
            ${currentMonthTotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            this month
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[140px] w-full">
        <ChartContainer
          config={{
            billed: {
              label: "Deposits",
              color: "hsl(142 76% 36%)",
            },
          }}
          className="h-full w-full"
        >
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="15%"
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.15}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={6}
              axisLine={false}
              fontSize={9}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  valueFormatter={(value) =>
                    `$${(value as number).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
                  }
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0]?.payload as ChartDataItem;
                      const total = data?.total || 0;
                      return `${label} — $${total.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
                    }
                    return label;
                  }}
                />
              }
            />
            <Bar
              dataKey="billed"
              stackId="a"
              fill="var(--color-billed)"
              radius={0}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};

const AdminProjections = () => {
  const jawn = useJawnClient();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [rawData, setRawData] = useState<RawStripeData>({
    invoices: MOCK_INVOICES,
    discounts: MOCK_DISCOUNTS,
    upcomingInvoices: MOCK_UPCOMING_INVOICES,
  });
  const [error, setError] = useState<string | null>(null);

  // Deposit data state
  const [depositData, setDepositData] = useState<DepositDataPoint[]>([]);
  const [depositLoading, setDepositLoading] = useState(true);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedMonths, setSelectedMonths] = useState<Record<string, string>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [invoiceSortConfig, setInvoiceSortConfig] = useState<SortConfig>({
    key: "amountAfterProcessing",
    direction: "desc",
  });
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<Record<string, "all" | "billed" | "upcoming">>({});

  // Product configuration
  const NEW_REQUESTS_PRICE = "price_1SnUFdFeVmeixR9wyCK1n4P1";
  const NEW_TEAM_PRICE = "price_1ScuAvFeVmeixR9wmmzNz0kV";

  type ProductConfig = {
    productName: string;
    productIds: string[];
    priceFilter?: { include?: string[]; exclude?: string[] };
  };

  const allProductsConfig: ProductConfig = {
    productName: "All Products",
    productIds: [
      "prod_Ta4LP5YB8WJKYQ",
      "prod_TZnisMB3EC5WHp",
      "prod_PpPUGArb7KCAZT",
      "prod_Rhx6vMVdGqih1E",
      "prod_QrcNwy2KPKiZJ5",
      "prod_QrcOEoxIc76n6K",
    ],
  };

  const newProductConfigs: ProductConfig[] = [
    { productName: "Pro", productIds: ["prod_Ta4LP5YB8WJKYQ"] },
    { productName: "Team", productIds: ["prod_Rhx6vMVdGqih1E"], priceFilter: { include: [NEW_TEAM_PRICE] } },
    { productName: "Storage", productIds: ["prod_TZnisMB3EC5WHp"] },
    { productName: "Requests", productIds: ["prod_PpPUGArb7KCAZT"], priceFilter: { include: [NEW_REQUESTS_PRICE] } },
  ];

  const legacyProductConfigs: ProductConfig[] = [
    { productName: "Requests (Old)", productIds: ["prod_PpPUGArb7KCAZT"], priceFilter: { exclude: [NEW_REQUESTS_PRICE] } },
    { productName: "Team (Old)", productIds: ["prod_Rhx6vMVdGqih1E"], priceFilter: { exclude: [NEW_TEAM_PRICE] } },
    { productName: "Pro (Old)", productIds: ["prod_QrcNwy2KPKiZJ5"] },
    { productName: "Prompts (Old)", productIds: ["prod_QrcOEoxIc76n6K"] },
  ];

  // Combined for data fetching
  const productConfigs = [allProductsConfig, ...newProductConfigs, ...legacyProductConfigs];

  const handleSort = (key: keyof InvoiceData) => {
    let direction: "asc" | "desc" = "asc";
    if (invoiceSortConfig.key === key && invoiceSortConfig.direction === "asc") {
      direction = "desc";
    }
    setInvoiceSortConfig({ key, direction });
  };

  const getInvoiceTypeFilter = (productName: string) => {
    return invoiceTypeFilter[productName] || "all";
  };

  const setProductInvoiceTypeFilter = (productName: string, filter: "all" | "billed" | "upcoming") => {
    setInvoiceTypeFilter(prev => ({ ...prev, [productName]: filter }));
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const selectMonth = (productName: string, monthKey: string) => {
    setSelectedMonths((prev) => ({
      ...prev,
      [productName]: monthKey,
    }));
  };

  const viewRawInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  // Fetch subscription data from API
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = (await jawn.GET("/v1/admin/subscription-data", {
          params: {
            query: {
              forceRefresh: refreshCounter > 0,
            },
          },
        })) as unknown as SubscriptionDataResponse;

        if (response.error) {
          throw new Error(response.error);
        }

        setRawData({
          invoices: response.data.invoices,
          discounts: response.data.discounts,
          upcomingInvoices: response.data.upcomingInvoices,
        });
      } catch (err) {
        logger.error({ error: err }, "Error fetching subscription data");
        setError("Failed to load subscription data. Using mock data instead.");
        setRawData({
          invoices: MOCK_INVOICES,
          discounts: MOCK_DISCOUNTS,
          upcomingInvoices: MOCK_UPCOMING_INVOICES,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [refreshCounter]);

  // Fetch deposit data (max 90 days per request, so we make multiple requests)
  useEffect(() => {
    const fetchDepositData = async () => {
      setDepositLoading(true);
      try {
        const allDeposits: DepositDataPoint[] = [];
        const now = new Date();

        // Make 3 requests of 60 days each to cover ~6 months
        for (let i = 0; i < 3; i++) {
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() - (i * 60));
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 60);

          console.log(`[Deposits] Fetching chunk ${i + 1}/3:`, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });

          const response = await jawn.POST("/v1/admin/wallet/analytics/time-series", {
            params: {
              query: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                groupBy: "day",
              },
            },
          });

          console.log(`[Deposits] Response for chunk ${i + 1}:`, response);

          const data = (response as any)?.data?.data || (response as any)?.data;
          if (data?.deposits) {
            allDeposits.push(...data.deposits);
          }
        }

        console.log("[Deposits] Total deposits fetched:", allDeposits.length);
        setDepositData(allDeposits);
      } catch (err) {
        console.error("[Deposits] Error fetching deposit data:", err);
        logger.error({ error: err }, "Error fetching deposit data");
        setDepositData([]);
      } finally {
        setDepositLoading(false);
      }
    };

    fetchDepositData();
  }, [refreshCounter]);

  const revenueCalculator = useMemo(() => {
    return new RevenueCalculator(rawData);
  }, [rawData]);

  const productRevenueData = useMemo(() => {
    if (!revenueCalculator) return {};

    return productConfigs.reduce(
      (acc, config) => {
        const productId =
          config.productName === "All Products"
            ? config.productIds
            : config.productIds[0] || "";

        acc[config.productName] = revenueCalculator.getProductRevenue(productId, 6, config.priceFilter);
        return acc;
      },
      {} as Record<string, MonthlyRevenueData>
    );
  }, [revenueCalculator, productConfigs]);

  const productChartData = useMemo(() => {
    return productConfigs.map((config) => {
      const monthlyData = productRevenueData[config.productName] || {};

      const allBilledInvoices = Object.values(monthlyData).flatMap(
        (data) => data.billedInvoices || []
      );

      const allUpcomingInvoices = Object.values(monthlyData).flatMap(
        (data) => data.upcomingInvoices || []
      );

      return {
        productName: config.productName,
        billedInvoices: allBilledInvoices,
        upcomingInvoices: allUpcomingInvoices,
      };
    });
  }, [productRevenueData, productConfigs]);

  const handleRefresh = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H1>Revenue Projections</H1>
          <Muted>Track subscription revenue across all products</Muted>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <Small className="text-destructive">{error}</Small>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
            <Muted>Loading subscription data...</Muted>
          </div>
        </div>
      )}

      {/* Revenue Charts Grid */}
      {!isLoading && (
        <>
          <div className="border border-border">
            {/* New Products Section */}
            <div className="border-t border-border">
              <div className="px-4 py-2 bg-muted/30 border-b border-border">
                <Small className="font-medium text-muted-foreground uppercase tracking-wide">New Products</Small>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3">
                {productChartData
                  .filter(d => d.productName === "All Products" || newProductConfigs.some(c => c.productName === d.productName))
                  .map(({ productName, billedInvoices, upcomingInvoices }, index) => (
                    <div
                      key={productName}
                      className={cn(
                        "border-border",
                        (index + 1) % 3 !== 0 && "md:border-r",
                        index >= 1 && "border-t md:border-t-0",
                        index >= 3 && "md:border-t"
                      )}
                    >
                      <RevenueChartCell
                        productName={productName}
                        billedInvoices={billedInvoices}
                        upcomingInvoices={upcomingInvoices}
                        isHighlighted={productName === "All Products"}
                        isOld={false}
                      />
                    </div>
                  ))}
                {/* Deposits Chart */}
                <div
                  className={cn(
                    "border-border",
                    "border-t md:border-t",
                  )}
                >
                  <DepositChartCell deposits={depositData} isLoading={depositLoading} />
                </div>
              </div>
            </div>

            {/* Legacy Products Section */}
            <div className="border-t border-border">
              <div className="px-4 py-2 bg-muted/30 border-b border-border">
                <Small className="font-medium text-muted-foreground uppercase tracking-wide">Legacy</Small>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3">
                {productChartData
                  .filter(d => legacyProductConfigs.some(c => c.productName === d.productName))
                  .map(({ productName, billedInvoices, upcomingInvoices }, index) => (
                    <div
                      key={productName}
                      className={cn(
                        "border-border",
                        (index + 1) % 3 !== 0 && "md:border-r",
                        index >= 1 && "border-t md:border-t-0",
                        index >= 3 && "md:border-t"
                      )}
                    >
                      <RevenueChartCell
                        productName={productName}
                        billedInvoices={billedInvoices}
                        upcomingInvoices={upcomingInvoices}
                        isHighlighted={false}
                        isOld={true}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div>
            <div className="flex flex-col">
              {productConfigs.map((config) => {
                const monthlyRevenueData = productRevenueData[config.productName] || {};
                const availableMonths = Object.keys(monthlyRevenueData).sort().reverse();

                if (!selectedMonths[config.productName] && availableMonths.length > 0) {
                  setTimeout(() => {
                    selectMonth(config.productName, availableMonths[0]);
                  }, 0);
                }

                const selectedMonth =
                  selectedMonths[config.productName] ||
                  (availableMonths.length > 0 ? availableMonths[0] : "");
                const revenueData = selectedMonth ? monthlyRevenueData[selectedMonth] : undefined;

                const invoicesSectionKey = `${config.productName}-invoices`;
                const isExpanded = expandedSections[invoicesSectionKey];

                return (
                  <Card key={config.productName} className="overflow-hidden">
                    <div
                      className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSection(invoicesSectionKey)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={20} className="text-muted-foreground" />
                        )}
                        <H3>{config.productName}</H3>
                      </div>
                      {revenueData && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{revenueData.billedInvoices.length} billed</span>
                          <span>{revenueData.upcomingInvoices.length} upcoming</span>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <CardContent className="border-t border-border pt-4">
                        {/* Month selector */}
                        {availableMonths.length > 0 && (
                          <div className="mb-4">
                            <Small className="font-medium mb-2 block">Select Month</Small>
                            <div className="flex flex-wrap gap-1.5">
                              {availableMonths.map((monthKey) => (
                                <Button
                                  key={monthKey}
                                  variant={selectedMonth === monthKey ? "default" : "outline"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectMonth(config.productName, monthKey);
                                  }}
                                  className="h-7 text-xs"
                                >
                                  {formatMonthKey(monthKey)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {revenueData ? (
                          <>
                            {/* Summary */}
                            <div className="mb-4 grid grid-cols-2 gap-4">
                              <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <Muted className="text-xs">Current Revenue</Muted>
                                <p className="text-xl font-bold tabular-nums">
                                  ${revenueData.current.toFixed(2)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <Muted className="text-xs">Projected Revenue</Muted>
                                <p className="text-xl font-bold tabular-nums">
                                  ${revenueData.projected.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Combined invoices with filter */}
                            {(revenueData.billedInvoices.length > 0 || revenueData.upcomingInvoices.length > 0) && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Small className="font-medium">
                                    Invoices ({revenueData.billedInvoices.length + revenueData.upcomingInvoices.length})
                                  </Small>
                                  <div className="flex gap-1">
                                    {(["all", "billed", "upcoming"] as const).map((filter) => (
                                      <Button
                                        key={filter}
                                        variant={getInvoiceTypeFilter(config.productName) === filter ? "default" : "outline"}
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProductInvoiceTypeFilter(config.productName, filter);
                                        }}
                                        className="h-6 text-xs px-2"
                                      >
                                        {filter === "all" ? "All" : filter === "billed" ? `Billed (${revenueData.billedInvoices.length})` : `Upcoming (${revenueData.upcomingInvoices.length})`}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <InvoiceTable
                                  invoices={
                                    getInvoiceTypeFilter(config.productName) === "all"
                                      ? [...revenueData.billedInvoices, ...revenueData.upcomingInvoices]
                                      : getInvoiceTypeFilter(config.productName) === "billed"
                                      ? revenueData.billedInvoices
                                      : revenueData.upcomingInvoices
                                  }
                                  sortConfig={invoiceSortConfig}
                                  onSort={handleSort}
                                  onViewRaw={viewRawInvoice}
                                  caption=""
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <Muted>No revenue data available</Muted>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isModalOpen}
        invoice={selectedInvoice}
        onClose={closeModal}
      />
    </div>
  );
};

export default AdminProjections;

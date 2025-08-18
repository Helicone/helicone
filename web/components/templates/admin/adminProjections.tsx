import { InvoiceTable, SortConfig } from "@/components/admin/InvoiceTable";
import { RevenueChart } from "@/components/admin/RevenueChart";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex max-h-[80vh] w-full max-w-4xl flex-col rounded-lg bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Raw Invoice Data</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="flex-grow overflow-auto p-4">
          <pre className="whitespace-pre-wrap rounded bg-slate-50 p-4 text-xs">
            {JSON.stringify(invoice, null, 2)}
          </pre>
        </div>
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

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedMonths, setSelectedMonths] = useState<Record<string, string>>(
    {},
  );
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for sorting configuration
  const [billedSortConfig, setBilledSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [upcomingSortConfig, setUpcomingSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  // Product configuration
  const productConfigs = [
    {
      productName: "All Products",
      productIds: [
        "prod_Rhx6vMVdGqih1E", // Team
        "prod_QrcNwy2KPKiZJ5", // Users
        "prod_PpPUGArb7KCAZT", // Usage
        "prod_QrcOEoxIc76n6K", // Prompts
        "prod_Rhx8ZQYhQOuunD", // Experiments
        "prod_Rhx7VbaUg1d1zA", // Evals
      ],
    },
    { productName: "Team", productIds: ["prod_Rhx6vMVdGqih1E"] },
    { productName: "Users", productIds: ["prod_QrcNwy2KPKiZJ5"] },
    { productName: "Usage", productIds: ["prod_PpPUGArb7KCAZT"] },
    { productName: "Prompts", productIds: ["prod_QrcOEoxIc76n6K"] },
    { productName: "Experiments", productIds: ["prod_Rhx8ZQYhQOuunD"] },
    { productName: "Evals", productIds: ["prod_Rhx7VbaUg1d1zA"] },
  ];

  // Handle sorting logic
  const handleSort = (
    tableType: "billed" | "upcoming",
    key: keyof InvoiceData,
  ) => {
    const currentConfig =
      tableType === "billed" ? billedSortConfig : upcomingSortConfig;
    const setConfig =
      tableType === "billed" ? setBilledSortConfig : setUpcomingSortConfig;

    let direction: "asc" | "desc" = "asc";
    // If clicking the same key, toggle direction
    if (currentConfig.key === key && currentConfig.direction === "asc") {
      direction = "desc";
    }
    setConfig({ key, direction });
  };

  // Toggle expanded state for a section
  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // View raw invoice data
  const viewRawInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  // Set selected month for a product
  const selectMonth = (productName: string, monthKey: string) => {
    setSelectedMonths((prev) => ({
      ...prev,
      [productName]: monthKey,
    }));
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

        // Store the fetched raw data in state
        setRawData({
          invoices: response.data.invoices,
          discounts: response.data.discounts,
          upcomingInvoices: response.data.upcomingInvoices,
        });
      } catch (err) {
        logger.error({ error: err }, "Error fetching subscription data");
        setError("Failed to load subscription data. Using mock data instead.");

        // Fall back to mock data if fetch fails
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

  // Instantiate the RevenueCalculator ONCE with the raw data
  const revenueCalculator = useMemo(() => {
    return new RevenueCalculator(rawData);
  }, [rawData]);

  // Compute monthly revenue data for each product once
  const productRevenueData = useMemo(() => {
    if (!revenueCalculator) return {};

    return productConfigs.reduce(
      (acc, config) => {
        const productId =
          config.productName === "All Products"
            ? config.productIds
            : config.productIds[0] || "";

        acc[config.productName] = revenueCalculator.getProductRevenue(
          productId,
          6,
        );
        return acc;
      },
      {} as Record<string, MonthlyRevenueData>,
    );
  }, [revenueCalculator, productConfigs]);

  // Prepare chart data from the memoized revenue data
  const productChartData = useMemo(() => {
    return productConfigs.map((config) => {
      const monthlyData = productRevenueData[config.productName] || {};

      // Collect all invoices across all months for the chart
      const allBilledInvoices = Object.values(monthlyData).flatMap(
        (data) => data.billedInvoices || [],
      );

      const allUpcomingInvoices = Object.values(monthlyData).flatMap(
        (data) => data.upcomingInvoices || [],
      );

      return {
        productName: config.productName,
        billedInvoices: allBilledInvoices,
        upcomingInvoices: allUpcomingInvoices,
      };
    });
  }, [productRevenueData, productConfigs]);

  // Refresh function
  const handleRefresh = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Subscription Management</h1>
        <button
          onClick={handleRefresh}
          className="rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh Data"}
        </button>
      </div>

      {/* Revenue Charts Grid */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Revenue Overview</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {productChartData.map(
            ({ productName, billedInvoices, upcomingInvoices }) => (
              <RevenueChart
                key={`chart-${productName}`}
                billedInvoices={billedInvoices}
                upcomingInvoices={upcomingInvoices}
                title={productName}
                months={6}
              />
            ),
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 gap-8">
        {productConfigs.map((config) => {
          // Get monthly revenue data from memoized results
          const monthlyRevenueData =
            productRevenueData[config.productName] || {};

          // Get available months
          const availableMonths = Object.keys(monthlyRevenueData)
            .sort()
            .reverse();

          // Set default selected month if not already set
          if (
            !selectedMonths[config.productName] &&
            availableMonths.length > 0
          ) {
            setTimeout(() => {
              selectMonth(config.productName, availableMonths[0]);
            }, 0);
          }

          const selectedMonth =
            selectedMonths[config.productName] ||
            (availableMonths.length > 0 ? availableMonths[0] : "");
          const revenueData = selectedMonth
            ? monthlyRevenueData[selectedMonth]
            : undefined;

          // Create unique section keys for this product
          const invoicesSectionKey = `${config.productName}-invoices`;

          return (
            <div key={config.productName} className="rounded-lg border p-4">
              <h2 className="mb-4 text-xl font-semibold">
                {config.productName} Details
              </h2>

              {/* Month selector */}
              {availableMonths.length > 0 && (
                <div className="mb-6">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Select Month:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableMonths.map((monthKey) => (
                      <button
                        key={monthKey}
                        onClick={() =>
                          selectMonth(config.productName, monthKey)
                        }
                        className={`rounded px-3 py-1 text-sm ${
                          selectedMonth === monthKey
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {formatMonthKey(monthKey)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {revenueData ? (
                <>
                  {/* Monthly revenue summary */}
                  <div className="mb-4">
                    <h3 className="mb-2 text-lg font-medium">
                      Summary for{" "}
                      {selectedMonth ? formatMonthKey(selectedMonth) : ""}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded bg-slate-50 p-3">
                        <p className="text-sm text-slate-500">
                          Current Revenue
                        </p>
                        <p className="text-2xl font-bold">
                          ${revenueData.current.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded bg-slate-50 p-3">
                        <p className="text-sm text-slate-500">
                          Projected Revenue
                        </p>
                        <p className="text-2xl font-bold">
                          ${revenueData.projected.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Billed invoices section */}
                  <div className="mb-4">
                    <div
                      className="flex cursor-pointer items-center justify-between border-b py-2"
                      onClick={() => toggleSection(invoicesSectionKey)}
                    >
                      <h3 className="text-lg font-medium">Billed Invoices</h3>
                      <span className="text-lg">
                        {expandedSections[invoicesSectionKey] ? "▼" : "►"}
                      </span>
                    </div>

                    {expandedSections[invoicesSectionKey] && (
                      <InvoiceTable
                        invoices={revenueData.billedInvoices}
                        sortConfig={billedSortConfig}
                        onSort={(key: keyof InvoiceData) =>
                          handleSort("billed", key)
                        }
                        onViewRaw={viewRawInvoice}
                        caption={formatMonthKey(selectedMonth)}
                      />
                    )}

                    {!expandedSections[invoicesSectionKey] && (
                      <p className="mt-2 text-sm text-gray-500">
                        {revenueData.billedInvoices.length} invoices (
                        {revenueData.billedInvoices.length > 0
                          ? `$${revenueData.billedInvoices
                              .reduce(
                                (sum, inv) => sum + inv.amountAfterProcessing,
                                0,
                              )
                              .toFixed(2)} total`
                          : "No revenue"}
                        )
                      </p>
                    )}
                  </div>

                  {/* Upcoming invoices section */}
                  <div>
                    <div
                      className="flex cursor-pointer items-center justify-between border-b py-2"
                      onClick={() =>
                        toggleSection(`${config.productName}-upcoming`)
                      }
                    >
                      <h3 className="text-lg font-medium">Upcoming Invoices</h3>
                      <span className="text-lg">
                        {expandedSections[`${config.productName}-upcoming`]
                          ? "▼"
                          : "►"}
                      </span>
                    </div>

                    {expandedSections[`${config.productName}-upcoming`] && (
                      <InvoiceTable
                        invoices={revenueData.upcomingInvoices}
                        sortConfig={upcomingSortConfig}
                        onSort={(key: keyof InvoiceData) =>
                          handleSort("upcoming", key)
                        }
                        onViewRaw={viewRawInvoice}
                        caption={`${formatMonthKey(selectedMonth)} (Projected)`}
                      />
                    )}

                    {!expandedSections[`${config.productName}-upcoming`] && (
                      <p className="mt-2 text-sm text-gray-500">
                        {revenueData.upcomingInvoices.length} invoices (
                        {revenueData.upcomingInvoices.length > 0
                          ? `$${revenueData.upcomingInvoices
                              .reduce(
                                (sum, inv) => sum + inv.amountAfterProcessing,
                                0,
                              )
                              .toFixed(2)} projected`
                          : "No projected revenue"}
                        )
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="italic text-gray-500">
                  No revenue data available
                </p>
              )}
            </div>
          );
        })}
      </div>

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

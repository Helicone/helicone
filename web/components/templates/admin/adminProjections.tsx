import React, { useState, useMemo, useEffect } from "react";
import { useJawnClient } from "@/lib/clients/jawnHook";
import {
  MOCK_INVOICES,
  MOCK_DISCOUNTS,
  MOCK_UPCOMING_INVOICES,
} from "@/components/layout/admin/mockStripeData";
import type Stripe from "stripe";
import {
  RawStripeData,
  RevenueCalculator,
  MonthlyRevenueData,
} from "@/lib/admin/RevenueCalculator";
import {
  getStripeLink,
  truncateID,
  formatCurrency,
  formatMonthKey,
} from "@/lib/uiUtils";
import { RevenueChart } from "@/components/admin/RevenueChart";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Raw Invoice Data</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="overflow-auto p-4 flex-grow">
          <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-4 rounded">
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
  const [dataFetched, setDataFetched] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedMonths, setSelectedMonths] = useState<Record<string, string>>(
    {}
  );
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        setDataFetched(true);
      } catch (err) {
        console.error("Error fetching subscription data:", err);
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

    return productConfigs.reduce((acc, config) => {
      const productId =
        config.productName === "All Products"
          ? config.productIds
          : config.productIds[0] || "";

      acc[config.productName] = revenueCalculator.getProductRevenue(
        productId,
        6
      );
      return acc;
    }, {} as Record<string, MonthlyRevenueData>);
  }, [revenueCalculator, productConfigs]);

  // Prepare chart data from the memoized revenue data
  const productChartData = useMemo(() => {
    return productConfigs.map((config) => {
      const monthlyData = productRevenueData[config.productName] || {};

      // Collect all invoices across all months for the chart
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

  // Refresh function
  const handleRefresh = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
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

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Subscription Management</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh Data"}
        </button>
      </div>

      {/* Revenue Charts Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productChartData.map(
            ({ productName, billedInvoices, upcomingInvoices }) => (
              <RevenueChart
                key={`chart-${productName}`}
                billedInvoices={billedInvoices}
                upcomingInvoices={upcomingInvoices}
                title={productName}
                months={6}
              />
            )
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
            <div key={config.productName} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">
                {config.productName} Details
              </h2>

              {/* Month selector */}
              {availableMonths.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Month:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableMonths.map((monthKey) => (
                      <button
                        key={monthKey}
                        onClick={() =>
                          selectMonth(config.productName, monthKey)
                        }
                        className={`px-3 py-1 text-sm rounded ${
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
                    <h3 className="text-lg font-medium mb-2">
                      Summary for{" "}
                      {selectedMonth ? formatMonthKey(selectedMonth) : ""}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-sm text-slate-500">
                          Current Revenue
                        </p>
                        <p className="text-2xl font-bold">
                          ${revenueData.current.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded">
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
                      className="flex justify-between items-center cursor-pointer py-2 border-b"
                      onClick={() => toggleSection(invoicesSectionKey)}
                    >
                      <h3 className="text-lg font-medium">Billed Invoices</h3>
                      <span className="text-lg">
                        {expandedSections[invoicesSectionKey] ? "▼" : "►"}
                      </span>
                    </div>

                    {expandedSections[invoicesSectionKey] &&
                      (revenueData.billedInvoices.length > 0 ? (
                        <div className="overflow-x-auto mt-2">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ID
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Customer
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {revenueData.billedInvoices.map((invoice) => (
                                <tr key={invoice.id}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <a
                                      href={
                                        invoice.subscriptionId &&
                                        !invoice.id.includes("in_")
                                          ? `https://dashboard.stripe.com/subscriptions/${invoice.subscriptionId}`
                                          : getStripeLink(invoice.id)
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {invoice.subscriptionId &&
                                      !invoice.id.includes("in_")
                                        ? `sub_${truncateID(
                                            invoice.subscriptionId
                                          )}`
                                        : truncateID(invoice.id)}
                                    </a>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {formatCurrency(
                                      invoice.amountAfterDiscount
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {invoice.customerEmail}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {invoice.created.toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {invoice.status}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <button
                                      onClick={() =>
                                        viewRawInvoice(invoice.rawJSON)
                                      }
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      View Raw
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic mt-2">
                          No billed invoices for {formatMonthKey(selectedMonth)}
                        </p>
                      ))}

                    {!expandedSections[invoicesSectionKey] && (
                      <p className="text-sm text-gray-500 mt-2">
                        {revenueData.billedInvoices.length} invoices (
                        {revenueData.billedInvoices.length > 0
                          ? `$${revenueData.billedInvoices
                              .reduce(
                                (sum, inv) => sum + inv.amountAfterDiscount,
                                0
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
                      className="flex justify-between items-center cursor-pointer py-2 border-b"
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

                    {expandedSections[`${config.productName}-upcoming`] ? (
                      revenueData.upcomingInvoices.length > 0 ? (
                        <div className="overflow-x-auto mt-2">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ID
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Customer
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {revenueData.upcomingInvoices.map(
                                (invoice, idx) => (
                                  <React.Fragment key={`${invoice.id}-${idx}`}>
                                    <tr>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        {invoice.id !== "upcoming" ? (
                                          <a
                                            href={getStripeLink(
                                              invoice.id,
                                              invoice.subscriptionId
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline"
                                          >
                                            {invoice.subscriptionId &&
                                            !invoice.id.includes("in_")
                                              ? `sub_${truncateID(
                                                  invoice.subscriptionId
                                                )}`
                                              : truncateID(invoice.id)}
                                          </a>
                                        ) : (
                                          "Upcoming"
                                        )}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        {formatCurrency(
                                          invoice.amountAfterDiscount
                                        )}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        {invoice.customerEmail}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        {invoice.created.toLocaleDateString()}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        {invoice.status}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        <button
                                          onClick={() =>
                                            viewRawInvoice(invoice.rawJSON)
                                          }
                                          className="text-blue-600 hover:text-blue-800"
                                        >
                                          View Raw
                                        </button>
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic mt-2">
                          No upcoming invoices for{" "}
                          {formatMonthKey(selectedMonth)}
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">
                        {revenueData.upcomingInvoices.length} invoices (
                        {revenueData.upcomingInvoices.length > 0
                          ? `$${revenueData.upcomingInvoices
                              .reduce(
                                (sum, inv) => sum + inv.amountAfterDiscount,
                                0
                              )
                              .toFixed(2)} projected`
                          : "No projected revenue"}
                        )
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">
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

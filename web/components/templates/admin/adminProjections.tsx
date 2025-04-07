import React, { useState, useMemo, useEffect } from "react";
import { useJawnClient } from "@/lib/clients/jawnHook";
import SubscriptionTable from "@/components/layout/admin/SubscriptionTable";
import {
  MOCK_SUBSCRIPTIONS,
  MOCK_INVOICES,
  MOCK_DISCOUNTS,
} from "@/components/layout/admin/mockStripeData";
import { SubscriptionAnalytics } from "@/lib/SubscriptionAnalytics";
import type Stripe from "stripe";
import ProductRevenueTrendChart from "@/components/admin/ProductRevenueTrendChart";

// Type for the API response
interface SubscriptionDataResponse {
  data: {
    subscriptions: Stripe.Subscription[];
    invoices: Stripe.Invoice[];
    discounts: Record<string, Stripe.Discount>;
  };
  error?: string;
}

const AdminProjections = () => {
  const jawn = useJawnClient();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(MOCK_SUBSCRIPTIONS);
  const [invoiceData, setInvoiceData] = useState(MOCK_INVOICES);
  const [discountData, setDiscountData] = useState(MOCK_DISCOUNTS);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);

  // Fetch subscription data from API
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = (await jawn.GET("/v1/admin/subscription-data", {
          params: {
            query: {
              forceRefresh: refreshCounter > 0, // Only force refresh if button was clicked
            },
          },
        })) as unknown as SubscriptionDataResponse;

        if (response.error) {
          throw new Error(response.error);
        }

        setSubscriptionData(
          response.data.subscriptions as typeof MOCK_SUBSCRIPTIONS
        );
        setInvoiceData(response.data.invoices as typeof MOCK_INVOICES);
        setDiscountData(response.data.discounts as typeof MOCK_DISCOUNTS);
        setDataFetched(true);
      } catch (err) {
        console.error("Error fetching subscription data:", err);
        setError("Failed to load subscription data. Using mock data instead.");

        // Fall back to mock data
        setSubscriptionData(MOCK_SUBSCRIPTIONS);
        setInvoiceData(MOCK_INVOICES);
        setDiscountData(MOCK_DISCOUNTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [refreshCounter]);

  // Create analytics engine
  const analytics = useMemo(
    () =>
      new SubscriptionAnalytics({
        subscriptions: subscriptionData,
        invoices: invoiceData,
        discounts: discountData,
      }),
    [subscriptionData, invoiceData, discountData]
  );

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

      <ProductRevenueTrendChart
        productId="prod_QrcNwy2KPKiZJ5"
        analytics={analytics}
      />

      <SubscriptionTable
        subscriptions={subscriptionData}
        invoices={invoiceData}
        discounts={discountData}
        analytics={analytics}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminProjections;

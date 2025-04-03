import React, { useState, useMemo } from "react";
import { useJawnClient } from "@/lib/clients/jawnHook";
import SubscriptionTable from "@/components/layout/admin/SubscriptionTable";
import {
  MOCK_SUBSCRIPTIONS,
  MOCK_INVOICES,
  MOCK_DISCOUNTS,
} from "@/components/layout/admin/mockStripeData";
import { SubscriptionAnalytics } from "@/lib/SubscriptionAnalytics";

const AdminProjections = () => {
  const jawn = useJawnClient();
  const [skipCache, setSkipCache] = useState(false);

  // In a real implementation, we would fetch this data from the API
  // For now, we're using mock data
  const subscriptionData = MOCK_SUBSCRIPTIONS;
  const invoiceData = MOCK_INVOICES;
  const discountData = MOCK_DISCOUNTS;

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

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-md bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="mb-6 text-xl font-semibold">Subscription Management</h2>
        <SubscriptionTable
          subscriptions={subscriptionData}
          invoices={invoiceData}
          discounts={discountData}
          analytics={analytics}
        />
      </div>
    </div>
  );
};

export default AdminProjections;

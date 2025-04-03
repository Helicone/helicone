import React, { useState, useMemo } from "react";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { H2 } from "@/components/ui/typography";
import SubscriptionTable from "@/components/layout/admin/SubscriptionTable";
import {
  mapAllSubscriptions,
  Subscription,
  StripeDiscount,
} from "@/lib/stripeUtils";
import Stripe from "stripe";

type SubscriptionResponse = {
  subscriptions: Stripe.Subscription[];
  cacheInfo: { fromCache: boolean; cacheAge: number | null };
};

type DiscountResponse = {
  discounts: Stripe.Coupon[]; // Stripe coupons
  cacheInfo: { fromCache: boolean; cacheAge: number | null };
};

const AdminProjections = () => {
  const jawn = useJawnClient();
  const [skipCache, setSkipCache] = useState(false);

  const {
    data: subscriptionData,
    isLoading: isLoadingSubscriptions,
    error: subscriptionError,
    refetch: refetchSubscriptions,
    isFetching: isFetchingSubscriptions,
  } = useQuery<SubscriptionResponse>({
    queryKey: ["admin", "mrr", skipCache],
    queryFn: async () => {
      const response = await (jawn.POST as any)("/v1/admin/mrr/query", {
        body: { skipCache },
      });
      if (response.error) throw response.error;
      setSkipCache(false); // Reset skipCache after fetch
      return response.data as SubscriptionResponse;
    },
  });

  const {
    data: discountData,
    isLoading: isLoadingDiscounts,
    error: discountError,
    refetch: refetchDiscounts,
    isFetching: isFetchingDiscounts,
  } = useQuery<DiscountResponse>({
    queryKey: ["admin", "discounts", skipCache],
    queryFn: async () => {
      const response = await (jawn.POST as any)("/v1/admin/discounts/query", {
        body: { skipCache },
      });
      if (response.error) throw response.error;
      return response.data as DiscountResponse;
    },
  });

  // Combined loading and error states
  const isLoading = isLoadingSubscriptions || isLoadingDiscounts;
  const isFetching = isFetchingSubscriptions || isFetchingDiscounts;
  const error = subscriptionError || discountError;

  // Handler for refresh button
  const handleRefresh = () => {
    setSkipCache(true);
    refetchSubscriptions();
    refetchDiscounts();
  };

  const subscriptionMap = useMemo(() => {
    return subscriptionData?.subscriptions
      ? mapAllSubscriptions(
          subscriptionData.subscriptions,
          discountData?.discounts
        )
      : {};
  }, [subscriptionData, discountData]);

  const subscriptionItems = useMemo(
    () =>
      Object.values(subscriptionMap).flatMap(
        (subscription) => subscription.items
      ),
    [subscriptionMap]
  );

  // Create a discount map for reference by the table
  const discountMap = useMemo(() => {
    const map: Record<string, StripeDiscount> = {};
    Object.values(subscriptionMap).forEach((subscription) => {
      subscription.discounts.forEach((discount) => {
        map[discount.id] = discount;
      });
    });
    return map;
  }, [subscriptionMap]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <H2>Subscription Analytics</H2>

        <div className="flex items-center gap-4">
          {subscriptionData?.cacheInfo && (
            <div className="text-xs text-muted-foreground">
              {subscriptionData.cacheInfo.fromCache ? (
                <span>
                  Cached data ({subscriptionData.cacheInfo.cacheAge} seconds
                  ago)
                </span>
              ) : (
                <span>Fresh data</span>
              )}
            </div>
          )}

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-2"></div>

      {/* Subscription Table Section */}
      <div className="flex flex-col gap-4">
        <H2>Subscription Details</H2>
        <SubscriptionTable
          subscriptions={Object.values(subscriptionMap)}
          isLoading={isLoading || isFetching}
          error={error}
          couponMap={discountMap}
        />
      </div>
    </div>
  );
};

export default AdminProjections;

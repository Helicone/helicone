import React, { useMemo } from "react";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StripeSubscription,
  ProcessedSubscription,
  PRODUCT_DISPLAY_MAP,
  processSubscriptionData,
} from "@/lib/stripeUtils";
import ProductMetricsCard from "@/components/layout/admin/ProductMetricsCard";
import { H2 } from "@/components/ui/typography";

type SubscriptionResponse = {
  subscriptions: StripeSubscription[]; // Use the specific type
  cacheInfo: { fromCache: boolean; cacheAge: number | null };
};

const ProductMetricsGrid = () => {
  const jawn = useJawnClient();
  const [skipCache, setSkipCache] = React.useState(false);

  // Fetch subscription data
  const {
    data: subscriptionData,
    isLoading,
    error,
    refetch,
    isFetching,
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

  // Handler for refresh button
  const handleRefresh = () => {
    setSkipCache(true);
    refetch();
  };

  // Use the shared processing function
  const processedData: ProcessedSubscription[] = useMemo(() => {
    return processSubscriptionData(subscriptionData?.subscriptions || []);
  }, [subscriptionData]);

  // Get unique products from subscription data
  const productIds = useMemo(() => {
    if (!processedData.length) return Object.keys(PRODUCT_DISPLAY_MAP);

    const uniqueProductIds = new Set<string>();

    processedData.forEach((sub) => {
      sub.rawSubscription.items.data.forEach((item) => {
        // Extract product ID correctly (can be string or object)
        const productId =
          typeof item.price.product === "string"
            ? item.price.product
            : item.price.product.id;
        uniqueProductIds.add(productId);
      });
    });

    return Array.from(uniqueProductIds);
  }, [processedData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <H2>Product Metrics</H2>

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

      {error ? (
        <div className="text-red-500">
          Error loading data: {error.toString()}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productIds.map((productId) => (
            <ProductMetricsCard
              key={productId}
              title={PRODUCT_DISPLAY_MAP[productId] || productId} // Use imported map
              productId={productId}
              subscriptions={processedData}
              isLoading={isLoading || isFetching}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductMetricsGrid;

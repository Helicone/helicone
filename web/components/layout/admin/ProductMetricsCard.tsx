import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H4, P, Small } from "@/components/ui/typography";
import {
  formatCurrency as formatCurrencyShared,
  ProductMetrics,
} from "@/lib/stripeUtils";
import { ArrowUpIcon, TagIcon } from "lucide-react";

interface ProductMetricsCardProps {
  title: string;
  productId: string;
  metrics: ProductMetrics; // Now accepts pre-calculated metrics
  isLoading?: boolean;
}

const ProductMetricsCard: React.FC<ProductMetricsCardProps> = ({
  title,
  productId,
  metrics,
  isLoading = false,
}) => {
  // Use the shared formatter, remove local definition
  const formatCurrency = (amount: number): string => {
    return formatCurrencyShared(amount * 100, "USD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  if (isLoading) {
    return (
      <Card className="min-h-[150px] flex items-center justify-center">
        <CardContent>
          <P className="text-muted-foreground">Loading metrics...</P>
        </CardContent>
      </Card>
    );
  }

  // Calculate discount percentage for display
  const discountPercentage =
    metrics.baseMRR > 0
      ? Math.round((metrics.discountedAmount / metrics.baseMRR) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          <H4>{title}</H4>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Small className="text-muted-foreground">Current MRR</Small>
            <div className="flex flex-col">
              {metrics.discountedAmount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCurrency(metrics.baseMRR)}
                  </span>
                  <span className="text-xs text-amber-400 flex items-center">
                    <TagIcon size={10} className="mr-1" />
                    {discountPercentage}% off
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <P className="text-2xl font-bold">
                  {formatCurrency(metrics.mrr)}
                </P>
                {/* Placeholder for growth indicator - to be implemented later */}
                <div className="text-xs text-green-500 flex items-center">
                  <ArrowUpIcon size={12} className="mr-1" />
                  0%
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Small className="text-muted-foreground">
              Active Subscriptions
            </Small>
            <div className="flex items-baseline gap-2">
              <P className="text-2xl font-bold">
                {metrics.activeSubscriptions}
              </P>
              <Small className="text-xs text-muted-foreground">
                of {metrics.totalSubscriptions} total
              </Small>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductMetricsCard;

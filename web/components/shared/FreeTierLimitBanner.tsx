import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { FeatureId, SubfeatureId } from "@/lib/features";

interface FreeTierLimitBannerProps {
  /**
   * The feature ID
   */
  feature: FeatureId;

  /**
   * Optional subfeature ID
   */
  subfeature?: SubfeatureId;

  /**
   * The current number of items
   */
  itemCount: number;

  /**
   * The maximum number of items allowed in the free tier
   */
  freeLimit: number;

  /**
   * Custom message to display. If not provided, a default message will be shown.
   */
  message?: string;

  /**
   * Whether to round the edges of the banner
   */
  rounded?: boolean;

  /**
   * Additional classes to apply to the banner
   */
  className?: string;

  /**
   * Custom text for the upgrade button
   */
  buttonText?: string;

  /**
   * The size of the upgrade button
   */
  buttonSize?: "xs" | "sm" | "default" | "lg";
}

export function FreeTierLimitBanner({
  feature,
  subfeature,
  itemCount,
  freeLimit,
  message,
  rounded = false,
  className = "",
  buttonText = "Upgrade",
  buttonSize = "sm",
}: FreeTierLimitBannerProps) {
  const defaultMessage = `You've used ${itemCount}/${freeLimit} ${feature}${
    subfeature ? ` ${subfeature}` : ""
  }. Upgrade for unlimited access.`;

  return (
    <div
      className={`bg-amber-50 dark:bg-amber-950/30 border-y border-amber-200 dark:border-amber-800 ${
        rounded ? "rounded-md" : ""
      } ${className}`}
    >
      <div className="px-4 py-1.5 mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-amber-800 dark:text-amber-200 text-sm font-medium">
            {message || defaultMessage}
          </span>
        </div>
        <div className="ml-6 sm:ml-0">
          {subfeature ? (
            <FreeTierLimitWrapper
              feature={feature}
              subfeature={subfeature}
              itemCount={itemCount}
            >
              <Button variant="action" size={buttonSize}>
                {buttonText}
              </Button>
            </FreeTierLimitWrapper>
          ) : (
            <FreeTierLimitWrapper feature={feature} itemCount={itemCount}>
              <Button variant="action" size={buttonSize}>
                {buttonText}
              </Button>
            </FreeTierLimitWrapper>
          )}
        </div>
      </div>
    </div>
  );
}

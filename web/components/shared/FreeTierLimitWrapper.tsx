import { ReactElement } from "react";
import { FeatureId } from "@/lib/features";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";

interface FreeTierLimitWrapperProps {
  feature: FeatureId;
  itemCount: number;
  children: ReactElement;
}

export function FreeTierLimitWrapper({
  feature,
  itemCount,
  children,
}: FreeTierLimitWrapperProps) {
  const { canCreate, featureConfig, upgradeMessage } = useFeatureLimit(
    feature,
    itemCount
  );

  console.log("feature", feature);

  // If they can create more items or there's no free tier config, just render the children
  if (canCreate || !featureConfig) {
    return <>{children}</>;
  }

  // Otherwise, wrap in the ProFeatureWrapper to trigger the upgrade dialog
  return (
    <ProFeatureWrapper
      featureName={featureConfig.upgradeFeatureName as any}
      limitMessage={upgradeMessage}
    >
      {children}
    </ProFeatureWrapper>
  );
}

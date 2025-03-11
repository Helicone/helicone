import { ReactElement } from "react";
import { FeatureId, SubfeatureId } from "@/packages/common/features";
import { useSubfeatureLimit } from "@/hooks/useFreeTierLimit";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";

interface FreeTierSubLimitWrapperProps {
  feature: FeatureId;
  subfeature: SubfeatureId;
  itemCount: number;
  children: ReactElement;
}

export function FreeTierSubLimitWrapper({
  feature,
  subfeature,
  itemCount,
  children,
}: FreeTierSubLimitWrapperProps) {
  const { canCreate, subfeatureConfig, upgradeMessage } = useSubfeatureLimit(
    feature,
    subfeature,
    itemCount
  );

  // If they can create more items or there's no limit, just render the children
  if (canCreate || !subfeatureConfig) {
    return <>{children}</>;
  }

  // Otherwise, wrap in the ProFeatureWrapper to trigger the upgrade dialog
  return (
    <ProFeatureWrapper
      featureName={subfeatureConfig.upgradeFeatureName as any}
      limitMessage={upgradeMessage}
    >
      {children}
    </ProFeatureWrapper>
  );
}

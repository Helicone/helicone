import React, { ReactElement, useState, useCallback } from "react";
import { FeatureId, SubfeatureId } from "@/lib/features";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { FeatureName } from "@/hooks/useProFeature";

interface FreeTierLimitWrapperProps {
  feature: FeatureId;
  itemCount: number;
  subfeature?: SubfeatureId;
  children: ReactElement;
}

export function FreeTierLimitWrapper({
  feature,
  itemCount,
  subfeature,
  children,
}: FreeTierLimitWrapperProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Always call the hook unconditionally
  const limitData = useFeatureLimit(feature, itemCount, subfeature);

  const { canCreate, upgradeMessage } = limitData;

  const featureConfig =
    "featureConfig" in limitData
      ? limitData.featureConfig
      : "subfeatureConfig" in limitData
      ? limitData.subfeatureConfig
      : null;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDialogOpen(true);
  }, []);

  if (canCreate || !featureConfig) {
    return <>{children}</>;
  }

  return (
    <>
      {React.cloneElement(children, {
        onClick: handleClick,
        className: children.props.className,
      })}

      <UpgradeProDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        featureName={featureConfig.upgradeFeatureName as FeatureName}
        limitMessage={upgradeMessage}
      />
    </>
  );
}

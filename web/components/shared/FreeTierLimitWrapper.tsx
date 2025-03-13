import React, { ReactElement, useState, useCallback } from "react";
import { FeatureId } from "@/lib/features";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { FeatureName } from "@/hooks/useProFeature";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { canCreate, featureConfig, upgradeMessage } = useFeatureLimit(
    feature,
    itemCount
  );

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

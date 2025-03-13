import React, { ReactElement, useState, useCallback } from "react";
import { FeatureId, SubfeatureId } from "@/lib/features";
import { useSubfeatureLimit } from "@/hooks/useFreeTierLimit";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { FeatureName } from "@/hooks/useProFeature";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { canCreate, subfeatureConfig, upgradeMessage } = useSubfeatureLimit(
    feature,
    subfeature,
    itemCount
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDialogOpen(true);
  }, []);

  if (canCreate || !subfeatureConfig) {
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
        featureName={subfeatureConfig.upgradeFeatureName as FeatureName}
        limitMessage={upgradeMessage}
      />
    </>
  );
}

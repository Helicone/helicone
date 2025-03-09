import React, { forwardRef, useCallback, useState } from "react";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { FeatureName, useProFeature } from "@/hooks/useProFeature";

interface ProFeatureWrapperProps {
  children: React.ReactElement;
  featureName: FeatureName;
  enabled?: boolean;
  limitMessage?: string;
}

export const ProFeatureWrapper = forwardRef<
  HTMLElement,
  ProFeatureWrapperProps
>(({ children, featureName, enabled = true, limitMessage }, ref) => {
  console.log("featureName", featureName);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasAccess } = useProFeature(featureName, enabled);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!hasAccess) {
        e.preventDefault();
        e.stopPropagation();
        setIsDialogOpen(true);
      } else if (children.props.onClick) {
        children.props.onClick(e);
      }
    },
    [hasAccess, children.props]
  );

  return (
    <>
      {React.cloneElement(children, {
        ref,
        onClick: handleClick,
        className: !hasAccess
          ? `${children.props.className || ""} `
          : children.props.className,
      })}

      <UpgradeProDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        featureName={featureName}
        limitMessage={limitMessage}
      />
    </>
  );
});

ProFeatureWrapper.displayName = "ProFeatureWrapper";

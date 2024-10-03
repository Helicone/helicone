import React, { forwardRef, useCallback, useState } from "react";
import { ProFeatureDialog } from "./ProFeatureDialog";
import { FeatureName, useProFeature } from "@/hooks/useProFeature";

interface ProFeatureWrapperProps {
  children: React.ReactElement;
  featureName: FeatureName;
  enabled?: boolean;
}

export const ProFeatureWrapper = forwardRef<
  HTMLElement,
  ProFeatureWrapperProps
>(({ children, featureName, enabled = true }, ref) => {
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

      <ProFeatureDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        featureName={featureName}
      />
    </>
  );
});

ProFeatureWrapper.displayName = "ProFeatureWrapper";

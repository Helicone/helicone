import React, { useState, forwardRef } from "react";
import { useOrg } from "@/components/layout/organizationContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Col } from "@/components/layout/common";

interface ProFeatureWrapperProps {
  children: React.ReactElement;
  featureName: string;
  enabled?: boolean;
}

export const ProFeatureWrapper = forwardRef<
  HTMLElement,
  ProFeatureWrapperProps
>(({ children, featureName, enabled = true }, ref) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const org = useOrg();
  const router = useRouter();

  const hasAccess = React.useMemo(() => {
    return (
      enabled &&
      (org?.currentOrg?.tier === "pro-20240913" ||
        (org?.currentOrg?.stripe_metadata as { addons?: { prompts?: boolean } })
          ?.addons?.prompts)
    );
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata, enabled]);

  const handleClick = (e: React.MouseEvent) => {
    if (!hasAccess) {
      e.preventDefault();
      e.stopPropagation();
      setIsDialogOpen(true);
    } else if (children.props.onClick) {
      children.props.onClick(e);
    }
  };

  const handleUpgrade = () => {
    setIsDialogOpen(false);
    router.push("/settings/billing");
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {React.cloneElement(children, {
              ref,
              onClick: handleClick,
              className: !hasAccess
                ? `${children.props.className || ""} cursor-not-allowed`
                : children.props.className,
            })}
          </TooltipTrigger>
          {!hasAccess && (
            <TooltipContent>
              <p>Upgrade to Pro</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
            <DialogDescription>
              The {featureName} feature is only available on the Pro plan.
              Upgrade now to unlock this and other premium features!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Col>
              <Button onClick={handleUpgrade}>Upgrade to Pro</Button>
              <span className="text-xs text-gray-500">14 day free trial</span>
            </Col>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

ProFeatureWrapper.displayName = "ProFeatureWrapper";

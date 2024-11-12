import useOnboardingContext, {
  ONBOARDING_STEPS,
  OnboardingStepLabel,
} from "@/components/layout/onboardingContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PopoverContentProps, PopoverProps } from "@radix-ui/react-popover";
import { cloneElement } from "react";
interface OnboardingPopoverContentProps extends PopoverContentProps {
  id?: string;
  onboardingStep: OnboardingStepLabel;
  next?: () => void;
  nextOverride?: () => void;
  delayMs?: number;
  triggerAsChild?: boolean;
}

interface OnboardingPopoverProps extends PopoverProps {
  open?: boolean;
  children: React.ReactNode;
  popoverContentProps: OnboardingPopoverContentProps;
  triggerAsChild?: boolean;
  setDataWhen?: boolean;
}

export const OnboardingPopover = ({
  children,
  open,
  popoverContentProps,
  triggerAsChild = true,
  setDataWhen = true,
  ...props
}: OnboardingPopoverProps) => {
  const { isOnboardingVisible, currentStep } = useOnboardingContext();
  return (
    <Popover
      open={
        isOnboardingVisible &&
        currentStep ===
          ONBOARDING_STEPS[popoverContentProps.onboardingStep].stepNumber &&
        (open !== undefined ? open : true)
      }
      {...props}
    >
      <PopoverTrigger asChild={triggerAsChild}>
        {cloneElement(children as React.ReactElement, {
          "data-onboarding-step": setDataWhen
            ? ONBOARDING_STEPS[popoverContentProps.onboardingStep].stepNumber
            : undefined,
        })}
      </PopoverTrigger>
      <OnboardingPopoverContent {...popoverContentProps} />
    </Popover>
  );
};

export const OnboardingPopoverContent = ({
  id,
  onboardingStep,
  next,
  nextOverride,
  delayMs,
  ...props
}: OnboardingPopoverContentProps) => {
  return (
    <PopoverContent
      {...props}
      className={cn(
        "z-[10000] bg-white p-4 w-[calc(100vw-2rem)] sm:max-w-md flex flex-col gap-2",
        props.className
      )}
    >
      <OnboardingPopoverInside
        onboardingStep={onboardingStep}
        next={next}
        nextOverride={nextOverride}
        delayMs={delayMs}
      />
    </PopoverContent>
  );
};

export const OnboardingPopoverInside = ({
  onboardingStep,
  next,
  nextOverride,
  delayMs,
}: OnboardingPopoverContentProps) => {
  const { setCurrentStep, currentStep } = useOnboardingContext();
  const { popoverData } = ONBOARDING_STEPS[onboardingStep];
  const { icon, title, stepNumber, description, additionalData } =
    popoverData ?? {};
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center text-slate-900 dark:text-slate-100">
          {icon}
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        <div className="px-3 py rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
          {stepNumber} / 5
        </div>
      </div>
      <p className="text-slate-500 text-[13px] leading-normal">{description}</p>
      {additionalData && additionalData}
      <Button
        variant="outline"
        className="w-full"
        onClick={
          nextOverride
            ? nextOverride
            : () => {
                next && next();
                setCurrentStep(currentStep + 1, delayMs);
              }
        }
      >
        Next
      </Button>
    </>
  );
};

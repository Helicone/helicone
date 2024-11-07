import useOnboardingContext, {
  ONBOARDING_STEPS,
  OnboardingStepLabel,
} from "@/components/layout/onboardingContext";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PopoverContentProps } from "@radix-ui/react-popover";

interface OnboardingPopoverProps extends PopoverContentProps {
  id?: string;
  // icon: React.ReactNode;
  // title: string;
  // stepNumber: number;
  // description: string | React.ReactNode;
  onboardingStep: OnboardingStepLabel;
  moreInfo?: React.ReactNode;
  next?: () => void;
  nextOverride?: () => void;
  delayMs?: number;
}

const OnboardingPopover = ({
  id,
  // icon,
  // title,
  // stepNumber,
  // description,
  onboardingStep,
  next,
  nextOverride,
  moreInfo,
  delayMs,
  ...props
}: OnboardingPopoverProps) => {
  const { setCurrentStep, currentStep } = useOnboardingContext();
  const { popoverData } = ONBOARDING_STEPS[onboardingStep];
  const { icon, title, stepNumber, description } = popoverData ?? {};

  return (
    <PopoverContent
      {...props}
      className={cn(
        "z-[10000] bg-white p-4 w-[calc(100vw-2rem)] sm:max-w-md flex flex-col gap-2",
        props.className
      )}
    >
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
    </PopoverContent>
  );
};

export default OnboardingPopover;

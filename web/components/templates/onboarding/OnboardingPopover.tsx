import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";
import { PopoverContentProps } from "@radix-ui/react-popover";

interface OnboardingPopoverProps extends PopoverContentProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  stepNumber: number;
  description: string | React.ReactNode;
  moreInfo?: React.ReactNode;
  next: () => void;
}

const OnboardingPopover = ({
  id,
  icon,
  title,
  stepNumber,
  description,
  next,
  moreInfo,
  ...props
}: OnboardingPopoverProps) => {
  return (
    <PopoverContent {...props}>
      <div className="flex justify-between items-center" id={`${id}--popover`}>
        <div className="flex gap-2 items-center text-slate-900 dark:text-slate-100">
          {icon}
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        <div className="px-3 py rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
          {stepNumber} / 5
        </div>
      </div>
      <p className="text-slate-500 text-[13px] leading-normal">{description}</p>
      <Button variant="outline" className="w-full" onClick={next}>
        Next
      </Button>
    </PopoverContent>
  );
};

export default OnboardingPopover;

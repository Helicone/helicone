import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    variant?: "default" | "secondary" | "action";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative h-2 w-full grow overflow-hidden rounded-full",
        variant === "default"
          ? "bg-slate-100 dark:bg-slate-800"
          : variant === "secondary"
          ? "bg-slate-200 dark:bg-slate-700"
          : "bg-slate-200 dark:bg-slate-800"
      )}
    >
      <SliderPrimitive.Range
        className={cn(
          "absolute h-full",
          variant === "default"
            ? "bg-slate-900 dark:bg-slate-50"
            : variant === "secondary"
            ? "bg-slate-400 dark:bg-slate-500"
            : "bg-heliblue"
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-5 w-5 rounded-full border-2 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none cursor-grab disabled:opacity-50 dark:bg-slate-950 dark:ring-offset-slate-950",
        variant === "default"
          ? "border-slate-900 dark:border-slate-50 dark:focus-visible:ring-slate-300"
          : variant === "secondary"
          ? "border-slate-400 dark:border-slate-50 dark:focus-visible:ring-slate-300"
          : "border-slate-100 dark:border-slate-900 bg-heliblue dark:bg-heliblue dark:focus-visible:ring-heliblue"
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

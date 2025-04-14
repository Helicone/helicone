import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "inline-flex items-center justify-center rounded-md font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "text-sm font-medium text-slate-800",
        badge: [
          "h-5 px-2.5 py-0.5 bg-sky-500 text-xs text-sky-50",
          "shadow shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)]",
          "border border-white/0 gap-2.5",
        ],
        action: [
          "bg-sky-600 hover:bg-sky-700 text-white h-11 w-full",
          "shadow shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)]",
          "border border-white/0 gap-2.5",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant }), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

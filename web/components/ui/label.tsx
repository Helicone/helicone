import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "inline-flex items-center justify-center font-medium leading-none",
  {
    variants: {
      variant: {
        default: "text-sm text-foreground",
        form: "text-sm text-foreground block mb-2",
        badge: [
          "h-5 px-2.5 py-0.5 bg-primary text-xs text-primary-foreground rounded-md",
          "shadow shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)]",
          "border border-transparent gap-2.5",
        ],
        action: [
          "bg-primary hover:bg-primary/90 text-primary-foreground h-11 w-full rounded-md",
          "shadow shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)]",
          "border border-transparent gap-2.5",
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

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-[hsl(var(--border))] px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/80",
        secondary:
          "border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80",
        destructive:
          "border-transparent bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/80",
        outline: "text-[hsl(var(--foreground))]",
        helicone:
          "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] rounded-md text-[11px] font-medium py-1 px-2 leading-tight",
        "helicone-sky":
          "h-5 border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] rounded-md text-xs font-normal",
        "helicone-orange":
          "h-5 border-transparent bg-[hsl(var(--orange))] text-[hsl(var(--orange-foreground))] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] rounded-md text-xs font-normal",
        "helicone-secondary":
          "h-5 border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] rounded-md text-xs font-normal",
        label:
          "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-light hover:bg-[hsl(var(--primary))]/90 tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90",
        outline:
          "border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        destructive:
          "bg-red-400 text-white hover:bg-red-500 dark:bg-red-700 dark:text-slate-100 dark:hover:bg-red-800",
        secondary:
          "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
        ghost:
          " hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        ghostLinear:
          "hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
        action:
          "text-white font-semibold hover:text-slate-100 border border-slate-200 bg-heliblue hover:bg-heliblue/90 dark:border-slate-800 dark:bg-heliblue dark:hover:bg-heliblue/90 dark:hover:text-slate-50 interactive",
      },
      size: {
        xs: "h-8 px-3",
        sm: "h-9 rounded-lg px-3",
        default: "px-4 py-2 h-10",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        sm_sleek: "h-6 rounded-md px-3 text-xs",
        md_sleek: "h-8 rounded-md px-3 text-xs",
        square_icon: "h-7 w-7 p-0",
      },
      asPill: {
        true: "rounded-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      asPill: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  asPill?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      asPill = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className, asPill }))}
        ref={ref}
        {...(props as any)}
      >
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

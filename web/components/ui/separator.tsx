import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      children,
      ...props
    },
    ref,
  ) =>
    children ? (
      <div className="flex items-center gap-4">
        <SeparatorPrimitive.Root
          ref={ref}
          decorative={decorative}
          orientation={orientation}
          className={cn(
            "flex-1 shrink-0 bg-slate-200 dark:bg-slate-800",
            orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
            className,
          )}
          {...props}
        />
        {children}
        <SeparatorPrimitive.Root
          ref={ref}
          decorative={decorative}
          orientation={orientation}
          className={cn(
            "flex-1 shrink-0 bg-slate-200 dark:bg-slate-800",
            orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
            className,
          )}
          {...props}
        />
      </div>
    ) : (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0 bg-slate-200 dark:bg-slate-800",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className,
        )}
        {...props}
      />
    ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };

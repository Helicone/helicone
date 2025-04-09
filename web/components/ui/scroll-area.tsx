import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    showBottomGradient?: boolean;
    orientation?: "vertical" | "horizontal" | "both";
    type?: "hover" | "scroll" | "always" | "auto";
    width?: "default" | "thin";
  }
>(
  (
    {
      className,
      children,
      showBottomGradient = false,
      orientation = "vertical",
      type = "hover",
      width,
      ...props
    },
    ref
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      type={type}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      {showBottomGradient && (
        <div className="h-28 bg-gradient-to-b from-transparent to-white dark:to-neutral-950 absolute bottom-0 left-0 right-0 pointer-events-none" />
      )}
      {orientation === "both" ? (
        <>
          <ScrollBar orientation="vertical" width={width} />
          <ScrollBar orientation="horizontal" width={width} />
        </>
      ) : (
        <ScrollBar orientation={orientation} width={width} />
      )}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<
    typeof ScrollAreaPrimitive.ScrollAreaScrollbar
  > & {
    width?: "default" | "thin";
  }
>(
  (
    { className, orientation = "vertical", width = "default", ...props },
    ref
  ) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full border-l border-l-transparent",
        orientation === "vertical" && (width === "thin" ? "w-1.5" : "w-2.5"),
        orientation === "horizontal" &&
          "flex-col border-t border-t-transparent",
        orientation === "horizontal" && (width === "thin" ? "h-1.5" : "h-2.5"),
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-slate-200/75 dark:bg-slate-800/75" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
);
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };

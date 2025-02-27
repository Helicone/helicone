import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    showBottomGradient?: boolean;
  }
>(({ className, children, showBottomGradient = false, ...props }, ref) => {
  const [isAtBottom, setIsAtBottom] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const MARGIN = 10;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      setIsAtBottom(scrollHeight - scrollTop <= clientHeight + MARGIN);
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className="h-full w-full rounded-[inherit]"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {showBottomGradient && (
        <div
          className={`h-28 bg-gradient-to-b from-transparent to-white dark:to-neutral-950 absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-300 ${
            isAtBottom ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-slate-200 dark:bg-slate-800" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };

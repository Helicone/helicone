import * as React from "react";

import { cn } from "@/lib/utils";
import clsx from "clsx";

export const ISLAND_MARGIN = clsx("max-w-[100rem] px-8");

const IslandContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(ISLAND_MARGIN, className)}
    {...props}
  />
));
IslandContainer.displayName = "Alert";

export { IslandContainer };

import * as React from "react";

import { cn } from "@/lib/utils";
import clsx from "clsx";

export const ISLAND_MARGIN = clsx("mx-4 sm:mx-6 md:mx-8 lg:mx-10");

const IslandContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(className, ISLAND_MARGIN)}
    {...props}
  />
));
IslandContainer.displayName = "Alert";

export { IslandContainer };

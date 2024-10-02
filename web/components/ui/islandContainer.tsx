import * as React from "react";

import { cn } from "@/lib/utils";

const IslandContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(className, "mx-8 max-w-[100rem]")}
    {...props}
  />
));
IslandContainer.displayName = "Alert";

export { IslandContainer };

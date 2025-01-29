import * as React from "react";
import { cn } from "@/lib/utils";

const BulletList = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("list-disc pl-[14px] text-slate-600", className)}
    {...props}
  />
));
BulletList.displayName = "BulletList";

const BulletListItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      "mt-2 first:mt-3 text-base font-medium leading-normal",
      className
    )}
    {...props}
  />
));
BulletListItem.displayName = "BulletListItem";

export { BulletList, BulletListItem };

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva("inline-flex items-center justify-center p-0.5", {
  variants: {
    variant: {
      default: "bg-slate-200 dark:bg-slate-800",
      secondary: "bg-white dark:bg-slate-950 dark:text-slate-400",
    },
    size: {
      default: "text-sm h-9",
      xs: "text-xs h-7",
    },
    asPill: {
      true: "rounded-full",
      false: "rounded-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    asPill: false,
  },
});

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, size, asPill, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, size, asPill, className }))}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium h-full px-2.5 ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 peer first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none peer-first:rounded-l-none peer-last:rounded-r-none",
  {
    variants: {
      variant: {
        default:
          "text-secondary data-[state=active]:text-primary border-slate-200 dark:border-slate-800 hover:bg-slate-100 hover:data-[state=active]:bg-slate-100 dark:hover:data-[state=active]:bg-slate-900 dark:hover:bg-slate-900 data-[state=active]:bg-white text-tertiary data-[state=active]:text-black data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-50",
        secondary:
          "bg-white hover:bg-slate-100 data-[state=active]:bg-slate-100 data-[state=active]:text-black dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50",
      },
      asPill: {
        true: "first:rounded-l-full last:rounded-r-full [&:not(:first-child):not(:last-child)]:rounded-none",
        false:
          "first:rounded-l-md last:rounded-r-md [&:not(:first-child):not(:last-child)]:rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      asPill: false,
    },
  }
);

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, asPill, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant, asPill, className }))}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };

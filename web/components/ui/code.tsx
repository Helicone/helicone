import React from "react";
import { cn } from "@/lib/utils";

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
}

export function Code({ className, children, ...props }: CodeProps) {
  return (
    <pre
      className={cn(
        "w-full overflow-auto p-4 bg-muted rounded-md text-sm font-mono",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  );
}

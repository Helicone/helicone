import * as React from "react";
import { cn } from "@/lib/utils";
import { LightbulbIcon } from "lucide-react";

export interface InfoBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType;
  variant?: "info" | "warning" | "success" | "error" | "helicone";
}

const variantStyles = {
  info: "bg-blue-50 border-l-blue-700 text-blue-700",
  warning: "bg-yellow-50 border-l-yellow-700 text-yellow-700",
  success: "bg-green-50 border-l-green-700 text-green-700",
  error: "bg-red-50 border-l-red-700 text-red-700",
  helicone: "bg-sky-50 border-l-sky-900 text-sky-900",
};

const InfoBox = React.forwardRef<HTMLDivElement, InfoBoxProps>(
  (
    {
      className,
      icon: Icon = LightbulbIcon,
      variant = "info",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "flex items-center space-x-2 rounded-md border px-4 py-2 border-l-4",
          variantStyles[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        <Icon
          className={`h-5 w-5 flex-shrink-0 ${
            variant === "info" ? "text-blue-500" : ""
          }`}
        />
        <div className="text-sm font-medium">{children}</div>
      </div>
    );
  }
);

InfoBox.displayName = "InfoBox";

export { InfoBox };

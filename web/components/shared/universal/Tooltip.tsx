import { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: "top" | "right" | "bottom" | "left";
  margin?: "-4" | "-2" | "0" | "2" | "4";
  glass?: boolean;

  className?: string;
}

export default function Tooltip({
  children,
  content,
  position = "right",
  margin = "2",
  glass = true,
  className,
}: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 [margin-bottom:var(--tooltip-margin)]",
    right:
      "left-full top-1/2 -translate-y-1/2 [margin-left:var(--tooltip-margin)]",
    bottom:
      "top-full left-1/2 -translate-x-1/2 [margin-top:var(--tooltip-margin)]",
    left: "right-full top-1/2 -translate-y-1/2 [margin-right:var(--tooltip-margin)]",
  };

  const marginValue = `${Number(margin) * 0.25}rem`;

  return (
    <div className={`group-four relative inline-block ${className}`}>
      {/* Tooltip Trigger */}
      {children}
      {/* Tooltip Content */}
      <div
        style={{ "--tooltip-margin": marginValue } as React.CSSProperties}
        className={`${
          glass ? "glass" : "bg-slate-50"
        } z-50 text-slate-700 select-none text-nowrap pointer-events-none invisible absolute rounded border border-slate-100 px-2 py-1 text-sm shadow-sm group-four-hover:visible ${
          positionClasses[position]
        }`}
      >
        {content}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { MoveUpRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface QuickstartStepProps {
  stepNumber: number;
  children: React.ReactNode;
  isCompleted: boolean;
  isActive: boolean;
}

export const QuickstartStep = ({
  stepNumber,
  children,
  isCompleted,
  isActive,
}: QuickstartStepProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center text-xs",
        isCompleted && "text-muted-foreground line-through",
        isActive &&
          "border-b-2 border-primary text-slate-600 dark:text-slate-400",
        !isCompleted && !isActive && "text-slate-600 dark:text-slate-400",
      )}
    >
      <span
        className={cn(
          "mr-1 text-xs",
          isCompleted ? "text-muted-foreground" : "text-slate-500",
        )}
      >
        {stepNumber}.
      </span>
      {children}
    </div>
  );
};

interface QuickstartStepCardProps {
  stepNumber: number;
  title: string;
  isCompleted: boolean;
  link: string;
  rightContent?: string;
  children?: React.ReactNode;
}

export const QuickstartStepCard = ({
  stepNumber,
  title,
  isCompleted,
  link,
  rightContent,
  children,
}: QuickstartStepCardProps) => {
  return (
    <div
      className={cn(
        "cursor-pointer rounded border border-border px-4 py-4 transition-colors duration-150",
        "bg-background hover:bg-background",
      )}
    >
      <Link href={link}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                "bg-muted text-muted-foreground",
              )}
            >
              {stepNumber}
            </div>
            <h3
              className={cn(
                "font-medium",
                isCompleted && "text-muted-foreground line-through",
              )}
            >
              {title}
            </h3>
          </div>
          {rightContent && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{rightContent}</span>
              <MoveUpRight className="h-3 w-3" />
            </div>
          )}
        </div>
      </Link>
      {children}
    </div>
  );
};

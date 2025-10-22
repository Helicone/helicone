import { cn } from "@/lib/utils";
import { Lock, MoveUpRight } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

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
  rightComponent?: React.ReactNode;
  headerAction?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  lockedMessage?: string;
}

export const QuickstartStepCard = ({
  stepNumber,
  title,
  isCompleted,
  link,
  rightContent,
  rightComponent,
  headerAction,
  children,
  disabled = false,
  lockedMessage = "Complete previous steps to unlock",
}: QuickstartStepCardProps) => {
  const cardContent = (
    <div
      className={cn(
        "rounded border border-border px-4 py-4 transition-colors duration-150",
        disabled
          ? "cursor-not-allowed bg-muted/30 opacity-60"
          : "cursor-pointer bg-background hover:bg-background",
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                "bg-muted text-muted-foreground",
              )}
            >
              {disabled ? <Lock size={12} /> : stepNumber}
            </div>
            {disabled ? (
              <h3 className="font-medium text-muted-foreground">{title}</h3>
            ) : (
              <Link href={link}>
                <h3
                  className={cn(
                    "font-medium",
                    isCompleted && "text-muted-foreground line-through",
                  )}
                >
                  {title}
                </h3>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!disabled && headerAction}
            {!disabled &&
              (rightComponent ? (
                rightComponent
              ) : rightContent ? (
                <Link href={link}>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{rightContent}</span>
                    <MoveUpRight className="h-3 w-3" />
                  </div>
                </Link>
              ) : null)}
          </div>
        </div>
      </div>
      {!disabled && children}
      {disabled && (
        <div className="mt-3 rounded-sm bg-muted/50 px-3 py-2">
          <p className="text-sm text-muted-foreground">{lockedMessage}</p>
        </div>
      )}
    </div>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent>
            <p>{lockedMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};

import { cn } from "@/lib/utils";
import { MoveUpRight } from "lucide-react";

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
          "mr-2 text-xs",
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
  onClick: () => void;
  rightContent?: string;
  children?: React.ReactNode;
}

export const QuickstartStepCard = ({
  stepNumber,
  title,
  isCompleted,
  onClick,
  rightContent,
  children,
}: QuickstartStepCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border border-border px-6 py-4 transition-colors duration-150",
        isCompleted
          ? "bg-background hover:bg-background"
          : "bg-card hover:bg-muted/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-sm",
              isCompleted
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            {stepNumber}
          </div>
          <h3
            className={cn(
              "text-lg font-semibold",
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
      {children}
    </div>
  );
};

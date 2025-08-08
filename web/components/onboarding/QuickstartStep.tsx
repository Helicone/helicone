import { cn } from "@/lib/utils";

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
        isActive && "text-slate-600 dark:text-slate-400 border-b-2 border-primary",
        !isCompleted && !isActive && "text-slate-600 dark:text-slate-400"
      )}
    >
      <span
        className={cn(
          "mr-2 text-xs",
          isCompleted ? "text-muted-foreground" : "text-slate-500"
        )}
      >
        {stepNumber}.
      </span>
      {children}
    </div>
  );
}; 
import { ReactNode } from "react";
import { P } from "../ui/typography";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  className?: string;
}
export default function Header(props: HeaderProps) {
  const { title, leftActions, rightActions, className } = props;
  return (
    <header
      className={cn(
        "h-16 shrink-0 bg-slate-100 dark:bg-slate-900 flex flex-row justify-between items-center w-full border-b border-border px-4",
        className
      )}
    >
      <div className="h-full flex flex-row items-center gap-2">
        <P className="text-muted-foreground font-semibold">{title}</P>
        {leftActions}
      </div>

      <div className="h-full flex flex-row items-center gap-2">
        {rightActions}
      </div>
    </header>
  );
}

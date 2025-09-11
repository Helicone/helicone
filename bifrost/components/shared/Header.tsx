import { ReactNode } from "react";
import { P } from "../ui/typography";

interface HeaderProps {
  title: string | ReactNode;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

export default function Header(props: HeaderProps) {
  const { title, leftActions, rightActions } = props;
  return (
    <header className="flex h-16 w-full shrink-0 flex-row items-center justify-between border-b border-border bg-slate-100 px-4 dark:bg-slate-900">
      <div className="flex h-full flex-row items-center gap-2">
        {typeof title === "string" ? (
          <P className="font-semibold text-muted-foreground">{title}</P>
        ) : (
          title
        )}
        {leftActions}
      </div>

      <div className="flex h-full flex-row items-center gap-2">
        {rightActions}
      </div>
    </header>
  );
}
import { ReactNode } from "react";

export default function GlassHeader({ children }: { children: ReactNode }) {
  return (
    <header className="min-w-full sticky top-0 z-10 glass border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between px-4 py-2.5">
      {children}
    </header>
  );
}

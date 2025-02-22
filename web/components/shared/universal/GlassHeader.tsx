import { ReactNode } from "react";

export default function GlassHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`z-10 min-w-full sticky top-0 glass flex flex-row items-center justify-between ${className}`}
    >
      {children}
    </header>
  );
}

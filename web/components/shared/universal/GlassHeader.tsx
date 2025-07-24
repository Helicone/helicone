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
      className={`glass sticky top-0 z-10 flex min-w-full flex-row items-center justify-between gap-2 ${className}`}
    >
      {children}
    </header>
  );
}

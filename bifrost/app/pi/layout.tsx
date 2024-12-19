"use client";

import QueryProvider from "../comparison/QueryProvider";

export default function PiLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}

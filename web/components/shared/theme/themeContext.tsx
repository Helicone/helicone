"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { usePathname } from "next/navigation";

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const pathname = usePathname();

  return (
    <NextThemesProvider
      {...props}
      forcedTheme={
        pathname?.includes("/signup") || pathname?.includes("/signin")
          ? "light"
          : undefined
      }
    >
      {children}
    </NextThemesProvider>
  );
}

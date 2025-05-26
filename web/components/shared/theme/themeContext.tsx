"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";
import { useLocation } from "react-router";

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const pathname = useLocation().pathname;

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

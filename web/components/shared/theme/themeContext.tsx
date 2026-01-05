"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";
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
        pathname?.includes("/signup") ||
        pathname?.includes("/signin") ||
        pathname?.includes("/sso") ||
        pathname?.includes("/reset")
          ? "light"
          : undefined
      }
    >
      {children}
    </NextThemesProvider>
  );
}

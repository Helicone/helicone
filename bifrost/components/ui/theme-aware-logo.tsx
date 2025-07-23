"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

interface ThemeAwareLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function ThemeAwareLogo({ 
  className,
  width = 150, 
  height = 150, 
  priority = true 
}: ThemeAwareLogoProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Logo stays the same in both themes - maintains blue branding */}
      <Image
        src="/static/logo.svg"
        alt="Helicone - Open-source LLM observability and monitoring platform for developers"
        height={height}
        width={width}
        priority={priority}
        className="w-auto h-auto"
      />
    </div>
  );
} 
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import React from "react";

interface CustomerCardProps {
  href: string;
  logo?: string; // Made logo optional to handle missing logos gracefully
  title: string;
  subtitle?: string; // Optional subtitle (e.g., for "Customer since")
}

export function CustomerCard({
  href,
  logo,
  title,
  subtitle,
}: CustomerCardProps) {
  return (
    <Link
      href={href}
      className="group flex w-full flex-col gap-2 rounded-xl p-4 text-left transition-all duration-300 hover:bg-sky-50 sm:gap-0 sm:p-2"
    >
      {/* Logo Container */}
      <div className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 transition-all duration-300 group-hover:bg-sky-100">
        {logo ? (
          <Image
            src={logo}
            alt={`${title} logo`}
            width={250}
            height={250}
            quality={95}
            className="max-h-full w-2/5 transform object-contain grayscale transition-transform duration-300 group-hover:scale-105 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
            Logo missing
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex h-fit w-full flex-col gap-1 p-2">
        <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <span className="text-muted-foreground text-sm">{subtitle}</span>
        )}
        <span className="text-accent-foreground flex items-center pt-2 text-sm font-medium">
          Read story
          <ChevronRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

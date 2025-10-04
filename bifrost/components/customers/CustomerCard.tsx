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
      className="flex flex-col gap-2 p-4 sm:gap-0 sm:p-2 w-full hover:bg-sky-50 rounded-xl transition-all duration-300 text-left group"
    >
      {/* Logo Container */}
      <div className="overflow-hidden rounded-xl relative group aspect-[16/9] w-full bg-slate-100 flex items-center justify-center group-hover:bg-sky-100 transition-all duration-300">
        {logo ? (
          <Image
            src={logo}
            alt={`${title} logo`}
            width={250}
            height={250}
            quality={95}
            className="object-contain transform group-hover:scale-105 transition-transform duration-300 max-h-full w-2/5 grayscale group-hover:grayscale-0"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
            Logo missing
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="w-full h-fit flex flex-col gap-1 p-2">
        <h2 className="font-bold text-lg leading-snug tracking-tight line-clamp-2">
          {title}
        </h2>
        {subtitle && (
          <span className="text-muted-foreground text-sm">{subtitle}</span>
        )}
        <span className="flex items-center text-accent-foreground text-sm font-medium pt-2">
          Read story
          <ChevronRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

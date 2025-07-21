"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
import Link from "next/link";
// import { humanReadableNumber } from "@/app/utils/formattingUtils";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

function humanReadableNumber(num: number): string {
  if (num >= 1_000_000_000_000) {
    return `${Math.ceil(num / 1_000_000_000_00) / 10} trillion`;
  } else if (num >= 1_000_000_000) {
    return `${Math.ceil(num / 1_000_000_00) / 10} billion`;
  } else if (num >= 1_000_000) {
    return `${Math.ceil(num / 1_000_00) / 10}M+`;
  } else if (num >= 1_000) {
    return `${Math.ceil(num / 100) / 10}k+`;
  }
  return num.toLocaleString();
}

const Stats = ({
  totalValuesData,
}: {
  totalValuesData?: {
    total_requests?: number;
    total_tokens?: number;
    total_cost?: number;
  };
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#f2f9fc]">
      <div
        className={cn(
          ISLAND_WIDTH,
          "flex items-start justify-between pb-32 pt-0"
        )}
      >
        <h1 className="max-w-[1100px] gap-y-4 text-wrap text-3xl font-semibold !leading-[150%] text-black md:text-6xl">
          Today,{" "}
          <span
            ref={elementRef}
            className={cn(
              "border-brand text-brand inline-block translate-y-[-10px] text-nowrap rounded-xl border-[3px] bg-[#E7F6FD] px-5 py-1 transition-transform duration-500",
              isVisible ? "rotate-[-3deg]" : "rotate-[0 deg]"
            )}
          >
            {humanReadableNumber(totalValuesData?.total_requests ?? 0)}
          </span>{" "}
          requests processed,{" "}
          <span className="text-brand">
            {humanReadableNumber(totalValuesData?.total_tokens ?? 0)}
          </span>{" "}
          tokens logged and <span className="text-brand">18.3 million</span>{" "}
          users tracked
        </h1>
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="https://us.helicone.ai/open-stats"
            target="_blank"
            rel="noopener"
          >
            <Button
              variant="ghost"
              size="landing_page"
              className="hover:bg-brand hover:border-brand lg:text-md z-[10] items-center gap-2 rounded-lg p-5 text-base hover:text-white md:py-4 md:text-2xl lg:px-6 lg:py-6"
            >
              Live
              <ArrowUpRight className="size-5 md:size-6" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Stats;

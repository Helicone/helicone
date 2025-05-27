"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
import Link from "next/link";
// import { humanReadableNumber } from "@/app/utils/formattingUtils";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

function humanReadableNumber(num: number | undefined): string {
  if (!num) return "0";
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
          "flex justify-between items-start pt-0 pb-32"
        )}
      >
        <h1 className="gap-y-4 text-3xl md:text-6xl font-semibold !leading-[150%] text-black max-w-[1100px] text-wrap">
          Today,{" "}
          <span
            ref={elementRef}
            className={cn(
              "inline-block bg-[#E7F6FD] border-[3px] border-brand rounded-xl py-1 px-5 text-brand translate-y-[-10px] transition-transform duration-500 text-nowrap",
              isVisible ? "rotate-[-3deg]" : "rotate-[0  deg]"
            )}
          >
            {humanReadableNumber(totalValuesData?.total_requests)}
          </span>{" "}
          requests processed,{" "}
          <span className="text-brand">
            {humanReadableNumber(totalValuesData?.total_tokens)}
          </span>{" "}
          tokens logged and <span className="text-brand">18.3 million</span>{" "}
          users tracked
        </h1>
        <div className="flex gap-2 items-center md:gap-4">
          <Link
            href="https://us.helicone.ai/open-stats"
            target="_blank"
            rel="noopener"
          >
            <Button
              variant="ghost"
              size="landing_page"
              className="hover:bg-brand hover:border-brand hover:text-white p-5 text-base md:text-2xl md:py-4 lg:py-6 lg:px-6 lg:text-md gap-2 rounded-lg items-center z-[10]"
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

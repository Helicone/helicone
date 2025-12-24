"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
// import { humanReadableNumber } from "@/app/utils/formattingUtils";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

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
          "flex justify-between items-start pt-8 md:pt-12 pb-12 md:pb-16"
        )}
      >
        <h1 className="gap-y-4 text-2xl md:text-6xl font-semibold !leading-[150%] text-black max-w-[1100px] text-wrap">
          Today,{" "}
          <span
            ref={elementRef}
            className={cn(
              "inline-block bg-[#E7F6FD] border-[3px] border-brand rounded-xl py-1 px-5 text-brand translate-y-[-10px] transition-transform duration-500 text-nowrap",
              isVisible ? "rotate-[-3deg]" : "rotate-[0  deg]"
            )}
          >
            {humanReadableNumber(totalValuesData?.total_requests ?? 0)}
          </span>{" "}
          requests processed,{" "}
          <span className="text-brand">1 trillion</span> tokens a month, <span className="text-brand">27.8 million</span>{" "}
          users tracked
        </h1>
      </div>
    </div>
  );
};

export default Stats;

"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
// import { humanReadableNumber } from "@/app/utils/formattingUtils";
import { cn } from "@/lib/utils";
import { ArrowUpRightIcon } from "lucide-react";
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
          "flex justify-between items-start pt-0 pb-32"
        )}
      >
        <h1 className="gap-y-4 text-3xl md:text-6xl font-semibold !leading-[150%] text-black max-w-[1100px] text-wrap">
          Today,{" "}
          <span
            ref={elementRef}
            className={cn(
              "inline-block bg-[#E7F6FD] border-[3px] border-brand rounded-xl py-2 px-7 text-brand translate-y-[-10px] transition-transform duration-500 text-nowrap",
              isVisible ? "rotate-[-3deg]" : "rotate-[0  deg]"
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
        <a
          href="https://us.helicone.ai/open-stats"
          className="hidden xl:block"
          target="_blank"
          rel="noreferrer"
        >
          <ArrowUpRightIcon
            className="w-10 h-10 text-landing-secondary"
            strokeWidth={2}
          />
        </a>
      </div>
    </div>
  );
};

export default Stats;

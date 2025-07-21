import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ISLAND_WIDTH } from "@/lib/utils";

const Production = () => {
  return (
    <div className={cn(ISLAND_WIDTH, "pb-12 pt-28 sm:pb-0")}>
      <div className="flex flex-col items-start gap-3 md:items-end md:gap-9">
        <div className="flex items-center gap-2.5">
          <p className="text-base sm:text-xl">03</p>
          <div className="text-base font-medium text-slate-700 sm:text-lg">
            Monitor
          </div>
        </div>
        <div className="flex flex-col items-start gap-6 text-left md:items-end md:text-right">
          <h2 className="max-w-[800px] text-wrap text-4xl font-semibold leading-[120%] text-black sm:text-5xl">
            Get complete visibility
            <br /> <span className="text-brand">into your AI apps</span>
          </h2>
          <p className="text-landing-description max-w-[520px] text-lg font-light leading-relaxed">
            Unified insights across all providers to quickly detect
            hallucinations, abuse and performance issues.
          </p>
        </div>
        <div className="z-[20] flex items-center gap-3">
          <Link
            href="https://docs.helicone.ai/features/advanced-usage/user-metrics"
            target="_blank"
            rel="noopener"
          >
            <Button variant="landing_primary" size="landing_page">
              Track user metrics
              <ArrowUpRight className="size-5 md:size-6" />
            </Button>
          </Link>
          <Link
            href="https://www.helicone.ai/changelog/20240910-slack-alerts"
            target="_blank"
            rel="noopener"
          >
            <Button variant="ghost" size="landing_page">
              Alerts
              <ArrowUpRight className="size-5 md:size-6" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Production;

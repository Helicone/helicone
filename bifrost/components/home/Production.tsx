import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ISLAND_WIDTH } from "@/lib/utils";

const Production = () => {
  return (
    <div className={cn(ISLAND_WIDTH, "pt-28 pb-12 sm:pb-0")}>
      <div className="flex flex-col items-start md:items-end gap-3 md:gap-9">
        <div className="flex items-center gap-2.5">
          {/* <p className="text-base sm:text-xl">03</p> */}
          {/* <div className="text-base sm:text-lg font-medium text-slate-700">
            Monitor
          </div> */}
        </div>
        <div className="flex flex-col items-start md:items-end gap-6 text-left md:text-right">
          <h2 className="font-semibold text-4xl sm:text-5xl leading-[120%] max-w-[800px] text-wrap text-black">
            Easy debugging
            <br /> <span className="text-brand">happy devs</span>
          </h2>
          <p className="text-lg max-w-[520px] text-landing-description font-light leading-relaxed">
            Get alerts on cost, latency, and error rates for every step in your workflow. Never let users see errors or slowdowns.
          </p>
        </div>
        <div className="flex gap-3 items-center z-[20]">
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

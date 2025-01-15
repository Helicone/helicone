import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ISLAND_WIDTH } from "@/lib/utils";

const Production = () => {
  return (
    <div className={cn(ISLAND_WIDTH, "pt-28 pb-12 sm:pb-0")}>
      <div className="flex flex-col items-start md:items-end gap-3 md:gap-9">
        <div className="flex items-center gap-2.5">
          <p className="text-base sm:text-xl">04</p>
          <div className="text-base sm:text-lg font-medium text-slate-700">
            Deploy
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-6 text-left md:text-right">
          <h2 className="font-semibold text-4xl sm:text-5xl leading-[120%] max-w-[800px] text-wrap text-black">
            Turn complexity and abstraction to{" "}
            <span className="text-brand">actionable insights</span>
          </h2>
          <p className="text-lg max-w-[520px] text-landing-description font-light leading-relaxed">
            Unified insights across all providers to quickly detect
            hallucinations, abuse and performance issues.
          </p>
        </div>
        <div className="flex gap-3 items-center z-[20]">
          <a
            href="https://docs.helicone.ai/features/advanced-usage/user-metrics"
            target="_blank"
          >
            <Button
              className="items-center gap-2 text-landing-secondary self-start"
              variant="outline"
            >
              <ArrowUpRightIcon size={16} />
              User Metrics
            </Button>
          </a>
          <a
            href="https://www.helicone.ai/changelog/20240910-slack-alerts"
            target="_blank"
          >
            <Button
              className="items-center gap-2 text-landing-secondary self-start"
              variant="outline"
            >
              <ArrowUpRightIcon className="w-4 h-4" />
              Alerts
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Production;

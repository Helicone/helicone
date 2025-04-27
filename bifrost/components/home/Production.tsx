import Link from "next/link";
import { ArrowUpRight, ArrowUpRightIcon } from "lucide-react";
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
            Turn complexity and abstraction{" "}
            <span className="text-brand">to actionable insights</span>
          </h2>
          <p className="text-lg max-w-[520px] text-muted-foreground leading-relaxed">
            Unified insights across all providers to quickly detect
            hallucinations, abuse and performance issues.
          </p>
        </div>
        <div className="flex gap-3 items-center z-[20]">
          <Link href="https://docs.helicone.ai/features/prompts/editor" target="_blank" rel="noopener">
            <Button
              className="bg-brand p-5 text-base md:text-lg md:py-4 lg:py-6 lg:px-6 lg:text-md gap-2 rounded-lg items-center z-[10]"
            >
              Track user metrics
              <ArrowUpRight className="size-5 md:size-6" />
            </Button>
          </Link>
          <Link href="https://www.helicone.ai/changelog/20240910-slack-alerts" target="_blank" rel="noopener">
            <Button
              variant="outline"
              className="p-5 text-base md:text-lg md:py-4 lg:py-6 lg:px-6 lg:text-md gap-2 rounded-lg items-center z-[10]"
            >
              Alerts
              <ArrowUpRight className="size-5 md:size-6" />
            </Button>
          </Link>
        </div>
      </div>
    </div >
  );
};

export default Production;

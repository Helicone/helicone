import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ISLAND_WIDTH } from "@/app/page";

const Production = () => {
  return (
    <div className={cn(ISLAND_WIDTH, "pt-28")}>
      <div className="flex flex-col items-end gap-9">
        <div className="flex items-center gap-2.5">
          <p className="text-xl">04</p>
          <div className="text-lg font-medium text-slate-700">Production</div>
        </div>
        <div className="flex flex-col items-end gap-6 text-right">
          <h2 className="font-semibold text-5xl leading-[120%] max-w-[800px] text-wrap text-black">
            Turn complexity and abstraction to{" "}
            <span className="text-brand">actionable insights</span>
          </h2>
          {/* <p className="text-lg max-w-[520px]">
            Monitor performance in real-time and catch regressions
            pre-deployment with LLM-as-a-judge or custom evals
          </p> */}
        </div>
        <div className="flex gap-3 items-center">
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

"use client";
import { ISLAND_WIDTH } from "@/app/page";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ArrowUpRightIcon } from "lucide-react";
import { useState } from "react";
import { XIcon, PlusIcon } from "lucide-react";
import EvaluateSVG from "@/public/static/home/evaluate";
const Evaluate = () => {
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  return (
    <div className="w-full pr-4 sm:pr-16 md:pr-24 2xl:pr-40 max-w-[2000px] mx-auto pt-28">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <EvaluateSVG />
        <div className="flex flex-col items-end gap-9">
          <div className="flex items-center gap-2.5">
            <p className="text-xl">02</p>
            <div className="text-lg font-medium text-slate-700">Evaluate</div>
          </div>
          <div className="flex flex-col items-end gap-6 text-right">
            <h2 className="font-semibold text-5xl leading-[120%] max-w-[600px] text-wrap text-black">
              <span className="text-brand">Prevent regression</span> and improve
              quality over-time
            </h2>
            <p className="text-lg max-w-[520px]">
              Monitor performance in real-time and catch regressions
              pre-deployment with LLM-as-a-judge or custom evals
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <a
              href="https://docs.helicone.ai/features/advanced-usage/scores"
              target="_blank"
            >
              <Button
                className="items-center gap-2 text-landing-secondary self-start"
                variant="outline"
              >
                <ArrowUpRightIcon className="w-4 h-4" />
                Scores
              </Button>
            </a>
            <a
              href="https://docs.helicone.ai/features/webhooks"
              target="_blank"
            >
              <Button
                className="items-center gap-2 text-landing-secondary self-start"
                variant="outline"
              >
                <ArrowUpRightIcon className="w-4 h-4" />
                Webhooks
              </Button>
            </a>
          </div>
          <div
            className={cn(
              "bg-slate-50 border border-slate-200 px-6 py-3 cursor-pointer max-w-[550px] transition-all duration-300 ease-in-out",
              isQuestionOpen ? "rounded-2xl" : "rounded-[100px]"
            )}
            onClick={() => setIsQuestionOpen(!isQuestionOpen)}
          >
            <div
              className={cn(
                "flex gap-2.5 items-center transition-all duration-300",
                isQuestionOpen && "justify-between"
              )}
            >
              <p className="text-lg">What is online and offline evaluation?</p>
              <div className="transition-transform duration-300">
                {isQuestionOpen ? (
                  <XIcon className="h-4 w-4 rotate-0" />
                ) : (
                  <PlusIcon className="h-4 w-4 rotate-0" />
                )}
              </div>
            </div>
            <div
              className={cn(
                "grid transition-all duration-300",
                isQuestionOpen
                  ? "grid-rows-[1fr] opacity-100 mt-4"
                  : "grid-rows-[0fr] opacity-0 mt-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="text-lg text-[#ACB3BA]">
                  {/* TODO: Change copy */}
                  There are two ways to interface with Helicone - Proxy and
                  Async. You can integrate with Helicone using the async
                  integration to ensure zero propagation delay, or choose proxy
                  for the simplest integration and access to gateway features
                  like caching, rate limiting, API key management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Evaluate;

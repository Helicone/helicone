"use client";
import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ArrowUpRightIcon } from "lucide-react";
import { useState } from "react";
import { XIcon, PlusIcon } from "lucide-react";
import EvaluateSVG from "@/public/static/home/evaluate";
const Evaluate = () => {
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  return (
    <div className="w-full px-0 md:pr-24 2xl:pr-40 max-w-[2000px] mx-auto pt-28">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <EvaluateSVG />
        <div className="flex flex-col items-start md:items-end gap-3 md:gap-9 order-1 md:order-2 px-4 sm:pr-0 sm:pl-16">
          <div className="flex items-center gap-2.5">
            <p className="text-base sm:text-xl">02</p>
            <div className="text-base sm:text-lg font-medium text-slate-700">
              Evaluate
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-6 text-left md:text-right">
            <h2 className="font-semibold text-4xl sm:text-5xl leading-[120%] max-w-[600px] text-wrap text-black">
              <span className="text-brand">Prevent regression</span> and improve
              quality over-time
            </h2>
            <p className="text-lg max-w-[520px] text-landing-description font-light leading-relaxed">
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
              isQuestionOpen ? "rounded-2xl" : "rounded-[24px]"
            )}
            onClick={() => setIsQuestionOpen(!isQuestionOpen)}
          >
            <div
              className={cn(
                "flex justify-between items-center transition-all duration-300"
              )}
            >
              <p className="ext-sm sm:text-lg">
                What is online and offline evaluation?
              </p>
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
                <p className="text-sm sm:text-lg font-light text-gray-400">
                  Online evaluation tests systems in real-time using live data
                  and actual user interactions. It&apos;s useful to capture
                  dynamic real-world scenarios. <br />
                  <br />
                  In contrast, offline evaluation occurs in controlled,
                  simulated environments using previous requests or synthetic
                  data, allowing safe and reproducible system assessment before
                  deployment.
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

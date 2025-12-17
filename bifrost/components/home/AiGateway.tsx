"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { XIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import PythonGatewayRequest from "@/public/static/home/python-gateway-request";

const AiGateway = () => {
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);

  return (
    <div className="w-full pr-4 sm:pr-16 md:pr-24 2xl:pr-40 max-w-[2000px] mx-auto pt-28">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="w-full sm:pl-16 mx-auto flex items-center justify-center py-0 md:py-8 pb-20">
          <Image
            src="/static/home/logos/route-homepage.webp"
            alt="AI Gateway Routing"
            width={1000}
            height={1000}
            className="w-[600px]  rounded-2xl"
          />
        </div>
        <div className="flex flex-col items-start md:items-end gap-3 md:gap-9 order-1 md:order-2 pl-4 md:pl-0">
          <div className="flex items-center gap-2.5">
            <p className="text-base sm:text-xl">01</p>
            <div className="text-base sm:text-lg font-medium text-slate-700">
              Route
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-6 text-left md:text-right">
            <h2 className="font-semibold text-4xl sm:text-5xl leading-[120%] max-w-[600px] text-wrap text-black">
              <span className="text-brand">Call tools with</span>
              <br />
              any model
            </h2>
            <p className="text-lg max-w-[520px] text-landing-description font-light leading-relaxed">
              Route to any model easily handling multi-model workflows and
              tracking sessions by user, task, or any custom property.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              href="https://docs.helicone.ai/ai-gateway/quickstart"
              target="_blank"
              rel="noopener"
            >
              <Button variant="landing_primary" size="landing_page">
                Start routing smartly
                <ArrowUpRight className="size-5" />
              </Button>
            </Link>
            <Link
              href="https://docs.helicone.ai/ai-gateway/introduction"
              target="_blank"
              rel="noopener"
            >
              <Button variant="secondary" size="landing_page">
                Learn more
              </Button>
            </Link>
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
              <p className="text-lg">What is LLM routing?</p>
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
                  LLM routing intelligently directs your requests to the optimal
                  model based on your criteria - whether that&apos;s cost,
                  speed, accuracy, or availability.
                  <br />
                  <br />
                  Instead of managing separate integrations for OpenAI,
                  Anthropic, Google, and dozens of other providers, you route
                  through one unified interface that automatically picks the
                  best option.
                  <br />
                  <br />
                  With smart load balancing, automatic failovers, and response
                  caching, routing ensures your app stays fast and reliable
                  while optimizing costs across all providers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiGateway;

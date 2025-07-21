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
    <div className="mx-auto w-full max-w-[2000px] pr-4 pt-28 sm:pr-16 md:pr-24 2xl:pr-40">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="mx-auto flex w-full items-center justify-center py-0 pb-20 sm:pl-16 md:py-8">
          <Image
            src="/static/home/logos/route-homepage.webp"
            alt="AI Gateway Routing"
            width={1000}
            height={1000}
            className="w-[600px] rounded-2xl"
          />
        </div>
        <div className="order-1 flex flex-col items-start gap-3 pl-4 md:order-2 md:items-end md:gap-9 md:pl-0">
          <div className="flex items-center gap-2.5">
            <p className="text-base sm:text-xl">01</p>
            <div className="text-base font-medium text-slate-700 sm:text-lg">
              Route
            </div>
          </div>
          <div className="flex flex-col items-start gap-6 text-left md:items-end md:text-right">
            <h2 className="max-w-[600px] text-wrap text-4xl font-semibold leading-[120%] text-black sm:text-5xl">
              <span className="text-brand">Smart & Speedy</span>
              <br />
              LLM Routing
            </h2>
            <p className="text-landing-description max-w-[520px] text-lg font-light leading-relaxed">
              We make sure you always have the best model for your request, so
              you can focus on shipping features.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              "max-w-[550px] cursor-pointer border border-slate-200 bg-slate-50 px-6 py-3 transition-all duration-300 ease-in-out",
              isQuestionOpen ? "rounded-2xl" : "rounded-[24px]"
            )}
            onClick={() => setIsQuestionOpen(!isQuestionOpen)}
          >
            <div
              className={cn(
                "flex items-center justify-between transition-all duration-300"
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
                  ? "mt-4 grid-rows-[1fr] opacity-100"
                  : "mt-0 grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="text-sm font-light text-gray-400 sm:text-lg">
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

"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import LogoBox from "./LogoBox";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import GlitchCycle from "../ui/GlitchCycle";

const Hero = () => {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center justify-center h-auto lg:h-[75vh] relative"
      )}
    >
      <div className="flex flex-wrap gap-x-12 gap-y-4 items-center mt-12 lg:mt-0 mb-12">
        <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-slate-200">
          <p>Backed by</p>
          <Image
            src="/static/home/yc-logo.webp"
            alt="Y Combinator"
            className="w-24 h-auto"
            width={96}
            height={24}
            priority
          />
        </div>
        <Image
          src="/static/home/productoftheday.webp"
          alt="Product of the Day"
          className="w-32 h-auto brightness-0 invert"
          width={128}
          height={32}
          priority
        />
      </div>
      <h1 className="text-5xl sm:text-7xl md:text-[84px] font-semibold mb-3 w-full max-w-3xl text-wrap text-white z-[10]">
        <span className="block">
          LLM{" "}
          <GlitchCycle
            words={["Monitoring", "Tracing", "Gateway"]}
            className="text-brand"
            intensity={0.8}
            frequency={3000}
            duration={600}
          />
        </span>
        <span className="block">for Startups</span>
      </h1>
      <p className="text-lg sm:text-xl 2xl:text-2xl text-slate-200 font-light mb-6 lg:mb-12 z-[10]">
        Get instant visibility into your
        <span className="hidden sm:inline">
          <br />
        </span>
        production-ready LLM applications.
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        <Link href="https://us.helicone.ai/signup">
          <Button className="bg-brand p-3 text-white md:text-lg md:py-4 lg:py-6 lg:px-6 lg:text-xl gap-2 rounded-lg items-center z-[10]">
            Start monitoring
            <ChevronRight className="size-5 md:size-6" />
          </Button>
        </Link>
        <Link href="/contact">
          <Button
            variant="ghost"
            className="p-5 text-slate-200 md:text-lg md:py-4 lg:py-6 lg:px-6 lg:text-xl gap-2 rounded-lg items-center z-[10]"
          >
            Contact sales
            <ChevronRight className="size-5 md:size-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Hero;

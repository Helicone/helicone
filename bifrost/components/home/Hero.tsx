import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";

const Hero = () => {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center justify-center h-auto lg:h-[60vh] relative",
        "max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-6"
      )}
    >
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 items-center mt-12 lg:mt-0 mb-12">
        <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
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
          className="w-32 h-auto"
          width={128}
          height={32}
          priority
        />
      </div>
      <h1 className="text-5xl sm:text-7xl md:text-[76px] font-semibold mb-3 max-w-3xl mx-auto text-wrap text-black z-[10]">
        Complete visibility into your <span className="text-brand">AI app</span>
      </h1>
      <p className="text-lg sm:text-xl 2xl:text-2xl text-landing-secondary font-light mb-6 lg:mb-8 max-w-2xl mx-auto z-[10]">
        The observability platform built for fast-growing AI startups to
        monitor, debug, and scale with confidence.
      </p>
      <div className="flex flex-col md:flex-row gap-4 mb-20">
        <Link href="https://us.helicone.ai/signup">
          <Button className="bg-brand p-5 text-base md:text-lg md:py-4 lg:py-7 lg:px-7 lg:text-xl gap-2 rounded-lg items-center z-[10]">
            Start monitoring
            <ChevronRight className="size-5 md:size-6" />
          </Button>
        </Link>
        <Link href="/contact">
          <Button
            variant="ghost"
            className="p-5 text-base md:text-lg md:py-4 lg:py-7 lg:px-7 lg:text-xl gap-2 rounded-lg items-center z-[10]"
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

import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronRightIcon } from "lucide-react";
import LogoBox from "./LogoBox";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";

const Hero = () => {
  return (
    <div
      className={cn(
        "flex flex-col justify-center h-auto lg:h-[75vh] relative",
        ISLAND_WIDTH
      )}
    >
      <div className="flex flex-wrap gap-x-12 gap-y-4 items-center mt-12 lg:mt-0 mb-12">
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
      <h1 className="text-5xl sm:text-7xl md:text-[84px] font-semibold mb-3 w-full max-w-3xl text-wrap text-black z-[10]">
        Ship your AI app with <span className="text-brand">confidence</span>
      </h1>
      <p className="text-lg sm:text-xl 2xl:text-2xl text-landing-secondary font-light mb-6 lg:mb-12 z-[10]">
        The all-in-one platform to monitor, debug and improve{" "}
        <span className="hidden sm:inline">
          <br />
        </span>
        production-ready LLM applications.
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        <Link href="https://us.helicone.ai/signup">
          <Button
            className="bg-brand p-5 text-base md:text-lg md:py-4 lg:py-7 lg:px-7 lg:text-xl gap-2 rounded-lg items-center z-[10]"
          >
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


      {/* LogoBox components already have 'hidden lg:block' class built-in */}
      <div className="hidden lg:block" aria-hidden="true">
        <LogoBox
          imgSrc="/static/home/gemini.webp"
          className="w-24 h-24 2xl:w-28 2xl:h-28 absolute top-20 right-1/3 2xl:translate-x-[-200px] translate-x-[-100px] rotate-[-15deg]"
          innerClassName="bg-white"
        />
        <LogoBox
          imgSrc="/static/home/logo2.webp"
          className="w-[140px] h-[140px] 2xl:w-[180px] 2xl:h-[180px] absolute top-40 right-1/3 2xl:translate-x-[50px] translate-x-[80px] rotate-[13deg]"
        />
        <LogoBox
          imgSrc="/static/home/chatgpt.webp"
          className="w-[140px] h-[140px] 2xl:w-[180px] 2xl:h-[180px] absolute top-16 right-1/4 2xl:translate-x-[150px] translate-x-[150px] rotate-[15deg]"
          innerClassName="bg-[#0FA37F] rounded-3xl"
        />
        <LogoBox
          imgSrc="/static/home/togetherai.webp"
          className="w-[120px] h-[120px] 2xl:w-[160px] 2xl:h-[160px] absolute top-12 right-0 2xl:-translate-x-[100px] -translate-x-[40px] rotate-[6deg]"
          innerClassName="rounded-3xl"
        />
        <LogoBox
          imgSrc="/static/home/anthropic.webp"
          className="w-[150px] h-[150px] 2xl:w-[190px] 2xl:h-[190px] absolute bottom-20 right-1/3 2xl:translate-x-[50px] translate-x-[50px] rotate-[13deg]"
          innerClassName="bg-white p-4"
        />
        <LogoBox
          imgSrc="/static/home/mistral.webp"
          className="w-24 h-24 2xl:w-28 2xl:h-28 absolute bottom-1/3 right-1/4 2xl:translate-x-[100px] translate-x-[100px] -rotate-[15deg]"
          innerClassName="bg-white p-2"
        />
        <LogoBox
          imgSrc="/static/home/groq.svg"
          className="w-[120px] h-[120px] 2xl:w-[160px] 2xl:h-[160px] absolute top-1/2 2xl:-translate-y-[100px] -translate-y-[50px] right-0 2xl:-translate-x-[150px] -translate-x-[80px] rotate-[27deg]"
          innerClassName="bg-white p-2"
        />
        <LogoBox
          imgSrc="/static/home/logo3.webp"
          className="w-28 h-28 2xl:w-32 2xl:h-32 absolute bottom-0 right-1/4 2xl:translate-x-[100px] translate-x-[180px] rotate-[-32deg]"
          innerClassName="bg-white p-2"
        />
        <LogoBox
          imgSrc="/static/home/logo4.webp"
          className="w-20 h-20 2xl:w-24 2xl:h-24 absolute bottom-24 right-0 2xl:-translate-x-[150px] -translate-x-[60px] rotate-[-15deg]"
        />
      </div>
    </div>
  );
};

export default Hero;

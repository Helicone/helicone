import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import LogoBox from "./LogoBox";
import Link from "next/link";

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
          <img
            src="/static/home/yc-logo.webp"
            alt="Y Combinator"
            className="w-24 h-auto"
          />
        </div>
        <img
          src="/static/home/productoftheday.webp"
          alt="Product of the Day"
          className="w-32 h-auto"
        />
      </div>
      <h1 className="text-5xl sm:text-7xl md:text-[84px] font-semibold mb-3 w-full max-w-3xl text-wrap text-black z-[10]">
        Ship your AI app with <span className="text-brand">confidence</span>
      </h1>
      <p className="text-lg sm:text-xl 2xl:text-2xl text-landing-secondary font-light mb-6 lg:mb-12 z-[10] max-w-xl">
        The all-in-one platform to monitor, debug and improve production-ready
        LLM applications.
      </p>
      <Link href="https://us.helicone.ai/signup">
        <button className="bg-brand py-3 px-6 lg:py-[18px] lg:px-9 text-base lg:text-[22px] 2xl:text-[26px] font-normal flex gap-3 rounded-lg text-white self-start items-center z-[10]">
          Get started for free
          <ChevronRightIcon
            className="w-5 sm:w-7 h-5 sm:h-7"
            strokeWidth={2.33}
          />
        </button>
      </Link>

      <LogoBox
        imgSrc="/static/home/gemini.webp"
        className="w-24 h-24 2xl:w-28 2xl:h-28 absolute top-20 right-1/3 2xl:translate-x-[-200px] translate-x-[-100px] translate-y-[-60px] 2xl:translate-y-0 rotate-[-15deg]"
        innerClassName="bg-white"
      />

      <LogoBox
        imgSrc="/static/home/logo2.webp"
        className="w-[120px] h-[120px] 2xl:w-[180px] 2xl:h-[180px] absolute top-40 right-1/3 2xl:translate-x-[50px] translate-x-[80px] rotate-[13deg]"
      />

      <LogoBox
        imgSrc="/static/home/chatgpt.webp"
        className="w-[160px] h-[160px] 2xl:w-[180px] 2xl:h-[180px] absolute top-16 right-1/4 2xl:translate-x-[150px] translate-x-[140px] 2xl:translate-y-0 translate-y-[-20px] rotate-[15deg]"
        innerClassName="bg-[#0FA37F] rounded-3xl"
      />
      <LogoBox
        imgSrc="/static/home/togetherai.webp"
        className="w-[110px] h-[110px] 2xl:w-[160px] 2xl:h-[160px] absolute top-12 right-0 2xl:-translate-x-[100px] -translate-x-[10px] rotate-[6deg]"
        innerClassName="rounded-3xl"
      />
      <LogoBox
        imgSrc="/static/home/anthropic.webp"
        className="w-[150px] h-[150px] 2xl:w-[190px] 2xl:h-[190px] absolute bottom-20 right-1/3 2xl:translate-x-[50px] translate-x-[50px] 2xl:translate-y-0 translate-y-[50px] rotate-[13deg]"
        innerClassName="bg-white p-4"
      />
      <LogoBox
        imgSrc="/static/home/mistral.webp"
        className="w-24 h-24 2xl:w-36 2xl:h-36 absolute bottom-1/3 right-1/4 2xl:translate-x-[100px] translate-x-[100px] -rotate-[15deg]"
        innerClassName="bg-white p-2"
      />
      <LogoBox
        imgSrc="/static/home/groq.svg"
        className="w-[120px] h-[120px] 2xl:w-[160px] 2xl:h-[160px] absolute top-1/2 2xl:-translate-y-[100px] -translate-y-[50px] right-0 2xl:-translate-x-[150px] -translate-x-[40px] rotate-[27deg]"
        innerClassName="bg-white p-2"
      />
      <LogoBox
        imgSrc="/static/home/logo3.webp"
        className="w-28 h-28 2xl:w-32 2xl:h-32 absolute bottom-0 right-1/4 2xl:translate-x-[100px] translate-x-[150px] rotate-[-32deg]"
        innerClassName="bg-white p-2"
      />
      <LogoBox
        imgSrc="/static/home/logo4.webp"
        className="w-20 h-20 2xl:w-28 2xl:h-28 absolute bottom-28 right-0 2xl:-translate-x-[150px] -translate-x-[20px]  2xl:translate-y-0 translate-y-[100px] rotate-[-15deg]"
      />
    </div>
  );
};

export default Hero;

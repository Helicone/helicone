import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import LogoBox from "./LogoBox";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";

const Hero = () => {
  return (
    <div
      className={cn(
        "flex flex-col justify-top h-auto lg:h-[65vh] relative",
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
      <h1 className="text-xl sm:text-7xl md:text-[84px] font-semibold mb-3 w-full max-w-4xl text-wrap text-black z-[10]">
        Build Reliable
        <br />
        <span className="text-brand">AI Apps</span>
      </h1>
      <p className="text-lg sm:text-xl 2xl:text-2xl text-landing-secondary font-light mb-6 lg:mb-12 z-[10]">
        The world's fastest-growing AI companies rely on Helicone
        <br />
        to route, debug, and analyze their applications.
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-col gap-2">
          <Link href="https://us.helicone.ai/signup">
            <Button className="bg-brand px-8 py-4 text-base md:text-lg md:py-3 lg:py-6 lg:px-10 lg:text-xl gap-2 rounded-lg items-center z-[10]">
              Try for free
              <ChevronRight className="size-5 md:size-6" />
            </Button>
          </Link>
          <p className="text-sm text-landing-secondary">
            No credit card required, 7-day free trial
          </p>
        </div>
      </div>

      <div className="hidden lg:block" aria-hidden="true">
        {/* Gemini */}
        <LogoBox
          imgSrc="/static/home/gemini.webp"
          className="w-[96px] h-[96px] 2xl:w-[112px] 2xl:h-[112px] absolute top-[80px] right-1/3 2xl:translate-x-[-200px] translate-x-[-100px] rotate-[-15deg]"
          innerClassName=""
        />
        {/* No Clue */}
        <LogoBox
          imgSrc="/static/home/logos/deepseek.webp"
          className="w-[120px] h-[120px] 2xl:w-[180px] 2xl:h-[180px] absolute top-[160px] right-1/3 2xl:translate-x-[50px] translate-x-[80px] rotate-[13deg]"
        />
        {/* OpenAI */}
        <LogoBox
          imgSrc="/static/home/logos/openai.webp"
          className="w-[140px] h-[140px] 2xl:w-[180px] 2xl:h-[180px] absolute top-[20px] right-1/4 2xl:translate-x-[150px] translate-x-[100px] rotate-[15deg]"
          innerClassName="rounded-3xl"
        />
        {/* Together AI */}
        <LogoBox
          imgSrc="/static/home/logos/togetherai.webp"
          className="w-[120px] h-[120px] 2xl:w-[160px] 2xl:h-[160px] absolute top-[48px] right-0 2xl:-translate-x-[100px] -translate-x-[40px] rotate-[6deg]"
          innerClassName="rounded-3xl"
        />
        {/* Anthropic */}
        <LogoBox
          imgSrc="/static/home/anthropic.webp"
          className="w-[150px] h-[150px] 2xl:w-[190px] 2xl:h-[190px] absolute bottom-[20px] right-1/3 2xl:translate-x-[50px] translate-x-[0px] rotate-[13deg]"
          innerClassName="p-4"
        />
        {/* Mistral */}
        <LogoBox
          imgSrc="/static/home/mistral.webp"
          className="w-[96px] h-[96px] 2xl:w-[112px] 2xl:h-[112px] absolute bottom-1/3 right-1/4 2xl:translate-x-[100px] translate-x-[100px] -rotate-[15deg]"
          innerClassName="p-2"
        />
        {/* Groq */}
        <LogoBox
          imgSrc="/static/home/logos/groq.webp"
          className="w-[120px] h-[120px] 2xl:w-[160px] 2xl:h-[160px] absolute top-1/2 2xl:-translate-y-[100px] -translate-y-[50px] right-0 2xl:-translate-x-[150px] -translate-x-[80px] rotate-[27deg]"
          innerClassName="p-2"
        />
        {/* OpenRouter  */}
        <LogoBox
          imgSrc="/static/home/logos/openrouter.webp"
          className="w-[112px] h-[112px] 2xl:w-[128px] 2xl:h-[128px] absolute bottom-0 right-1/4 2xl:translate-x-[100px] translate-x-[100px] rotate-[-32deg]"
          innerClassName="p-2"
        />
        {/* AnyScale? */}
        <LogoBox
          imgSrc="/static/home/logo4.webp"
          className="w-[80px] h-[80px] 2xl:w-[96px] 2xl:h-[96px] absolute bottom-[60px] right-0 2xl:-translate-x-[150px] -translate-x-[60px] rotate-[-15deg]"
        />
      </div>
    </div>
  );
};

export default Hero;

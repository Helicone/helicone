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
        "justify-top relative flex h-auto flex-col lg:h-[500px] lg:w-[1300px] 2xl:h-[550px] 2xl:w-[1500px]",
        ISLAND_WIDTH
      )}
    >
      <div className="mb-12 mt-12 flex flex-wrap items-center gap-x-12 gap-y-4 lg:mt-0">
        <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium">
          <p>Backed by</p>
          <Image
            src="/static/home/yc-logo.webp"
            alt="Y Combinator"
            className="h-auto w-24"
            width={96}
            height={24}
            priority
          />
        </div>
        <Image
          src="/static/home/productoftheday.webp"
          alt="Product of the Day"
          className="h-auto w-32"
          width={128}
          height={32}
          priority
        />
      </div>
      <h1 className="z-[10] mb-3 w-full max-w-4xl text-wrap text-xl font-semibold text-black sm:text-7xl md:text-[84px]">
        Build Reliable
        <br />
        <span className="text-brand">AI Apps</span>
      </h1>
      <p className="text-landing-secondary z-[10] mb-6 text-lg font-light sm:text-xl lg:mb-12 2xl:text-2xl">
        The world&apos;s fastest-growing AI companies rely on Helicone
        <br />
        to route, debug, and analyze their applications.
      </p>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-col gap-2">
          <Link href="https://us.helicone.ai/signup">
            <Button className="bg-brand z-[10] items-center gap-2 rounded-lg px-8 py-4 text-base md:py-3 md:text-lg lg:px-10 lg:py-6 lg:text-xl">
              Try for free
              <ChevronRight className="size-5 md:size-6" />
            </Button>
          </Link>
          <p className="text-landing-secondary text-sm">
            No credit card required, 7-day free trial
          </p>
        </div>
      </div>

      <div className="hidden lg:block" aria-hidden="true">
        {/* Gemini */}
        <LogoBox
          imgSrc="/static/home/gemini.webp"
          className="absolute right-1/3 top-[80px] h-[96px] w-[96px] translate-x-[-100px] rotate-[-15deg]"
          innerClassName=""
        />
        {/* No Clue */}
        <LogoBox
          imgSrc="/static/home/logos/deepseek.webp"
          className="absolute right-1/3 top-[160px] h-[120px] w-[120px] translate-x-[80px] rotate-[13deg]"
        />
        {/* OpenAI */}
        <LogoBox
          imgSrc="/static/home/logos/openai.webp"
          className="absolute right-1/4 top-[20px] h-[140px] w-[140px] translate-x-[100px] rotate-[15deg]"
          innerClassName="rounded-3xl"
        />
        {/* Together AI */}
        <LogoBox
          imgSrc="/static/home/logos/togetherai.webp"
          className="absolute right-0 top-[48px] h-[120px] w-[120px] -translate-x-[40px] rotate-[6deg]"
          innerClassName="rounded-3xl"
        />
        {/* Anthropic */}
        <LogoBox
          imgSrc="/static/home/anthropic.webp"
          className="absolute bottom-[20px] right-1/3 h-[150px] w-[150px] translate-x-[0px] rotate-[13deg]"
          innerClassName="p-4"
        />
        {/* Mistral */}
        <LogoBox
          imgSrc="/static/home/mistral.webp"
          className="absolute bottom-1/3 right-1/4 h-[96px] w-[96px] translate-x-[100px] -rotate-[15deg]"
          innerClassName="p-2"
        />
        {/* Groq */}
        <LogoBox
          imgSrc="/static/home/logos/groq.webp"
          className="absolute right-0 top-1/2 h-[120px] w-[120px] -translate-x-[80px] -translate-y-[50px] rotate-[27deg]"
          innerClassName="p-2"
        />
        {/* OpenRouter  */}
        <LogoBox
          imgSrc="/static/home/logos/openrouter.webp"
          className="absolute bottom-0 right-1/4 h-[112px] w-[112px] translate-x-[100px] rotate-[-32deg]"
          innerClassName="p-2"
        />
        {/* AnyScale? */}
        <LogoBox
          imgSrc="/static/home/logo4.webp"
          className="absolute bottom-[60px] right-0 h-[80px] w-[80px] -translate-x-[60px] rotate-[-15deg]"
        />
      </div>
    </div>
  );
};

export default Hero;

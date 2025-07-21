"use client";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import LogoBox from "./LogoBox";
import { useState } from "react";
import { ISLAND_WIDTH } from "@/lib/utils";
import Image from "next/image";
import { ChevronRight as ChevronRightIcon } from "lucide-react";

const CTA = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex h-[80vh] flex-col overflow-hidden bg-[#F2F9FC]">
      <div
        className="absolute inset-0 z-[0] hidden h-full w-full md:block"
        style={{
          backgroundImage: "url(/static/home/cta-bg.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>

      <div className="relative z-[10] flex h-full w-full flex-col items-center justify-center gap-6 md:gap-12">
        <div
          className="absolute inset-0 z-[0] block h-full w-full md:hidden"
          style={{
            backgroundImage: "url(/static/home/cta-mobile.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div
          className="absolute inset-0 z-[1] block h-full w-full md:hidden"
          style={{
            backgroundImage: "url(/static/home/cta-mobile.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div className="z-[10] flex flex-col items-center text-wrap text-4xl font-semibold leading-snug text-slate-500 md:text-5xl">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <div
              className={cn(
                "border-brand text-brand rounded-xl border-[3px] bg-[#E7F6FD] px-7 py-2 transition-transform duration-1000 xl:py-4",
                "rotate-[-3deg]"
              )}
            >
              <h1>Reliable</h1>
            </div>
            <h1>AI applications</h1>
          </div>
          <h1>starting today</h1>
        </div>
        <Link href="https://us.helicone.ai/signup" className="z-[10]">
          <Button
            size="lg"
            className="bg-brand hover:bg-brand/100 z-[10] rounded-lg px-4 py-[18px] text-base font-normal text-white md:gap-3 md:rounded-2xl md:px-12 md:py-12 md:text-[40px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Try Helicone for free
            {isHovered && (
              <ChevronRightIcon
                className="h-5 w-5 md:h-12 md:w-12"
                strokeWidth={2.5}
              />
            )}
          </Button>
        </Link>
      </div>
      <div
        className={cn(
          ISLAND_WIDTH,
          "z-[10] mb-11 mt-11 flex flex-col items-start justify-between gap-y-6 md:mt-0 md:flex-row md:items-center md:gap-y-0"
        )}
      >
        <p className="text-sm font-medium md:text-xl">We protect your data.</p>
        <div className="flex items-center gap-12">
          <div className="flex flex-col items-center gap-3 md:flex-row">
            <Image
              src="/static/home/soc2.webp"
              alt="SOC 2"
              width={48}
              height={48}
            />
            <p className="text-xs md:text-sm">SOC2 Certified</p>
          </div>
          <div className="flex flex-col items-center gap-3 md:flex-row">
            <Image
              src="/static/home/hipaa.webp"
              alt="HIPAA"
              width={48}
              height={48}
            />
            <p className="text-xs md:text-sm">HIPAA Compliant</p>
          </div>
        </div>
      </div>
      <LogoBox
        imgSrc="/static/home/gemini.webp"
        className={cn(
          "absolute bottom-28 left-4 h-[178px] w-[178px] rotate-[-27deg] transition-all duration-1000 2xl:h-[220px] 2xl:w-[220px]",
          isHovered &&
            "bottom-16 left-1/2 h-[160px] w-[160px] translate-x-[-380px] rotate-[-27deg] 2xl:h-[200px] 2xl:w-[200px] 2xl:translate-x-[-600px]"
        )}
        innerClassName=""
      />

      <LogoBox
        imgSrc="/static/home/logos/deepseek.webp"
        className={cn(
          "absolute left-44 top-1/3 h-[140px] w-[140px] transition-all duration-1000 2xl:left-56 2xl:h-[180px] 2xl:w-[180px]",
          isHovered &&
            "!left-1/2 translate-x-[-450px] translate-y-[50px] rotate-[17deg] 2xl:translate-x-[-550px]"
        )}
      />

      <LogoBox
        imgSrc="/static/home/mistral.webp"
        className={cn(
          "absolute left-0 top-1/4 h-[140px] w-[140px] -rotate-[25deg] transition-all duration-1000 2xl:h-[180px] 2xl:w-[180px]",
          isHovered &&
            "left-1/2 translate-x-[-620px] translate-y-[10px] rotate-[20deg] 2xl:translate-x-[-720px]"
        )}
        innerClassName="p-2"
      />

      <LogoBox
        imgSrc="/static/home/logos/openai.webp"
        className={cn(
          "absolute left-36 top-0 h-[194px] w-[194px] transition-all duration-1000 2xl:left-48 2xl:h-[240px] 2xl:w-[240px]",
          isHovered && "!left-1/2 top-10 translate-x-[-470px] rotate-[-45deg]"
        )}
        innerClassName="rounded-3xl"
      />

      <LogoBox
        imgSrc="/static/home/logos/togetherai.webp"
        className={cn(
          "absolute right-4 top-0 h-[142px] w-[142px] rotate-[40deg] transition-all duration-1000 2xl:h-[180px] 2xl:w-[180px]",
          isHovered && "right-1/2 translate-x-[400px] rotate-[-3deg]"
        )}
        innerClassName="rounded-3xl"
      />

      <LogoBox
        imgSrc="/static/home/anthropic.webp"
        className={cn(
          "absolute bottom-40 right-20 h-[176px] w-[176px] translate-x-[50px] rotate-[15deg] transition-all duration-1000 2xl:h-[220px] 2xl:w-[220px] 2xl:translate-x-[50px]",
          isHovered &&
            "bottom-20 right-1/2 translate-x-[400px] rotate-[28deg] 2xl:translate-x-[560px]"
        )}
        innerClassName="p-4"
      />

      <LogoBox
        imgSrc="/static/home/logos/groq.webp"
        className={cn(
          "absolute right-56 top-1/3 h-[135px] w-[135px] rotate-[43deg] transition-all duration-1000 2xl:h-[160px] 2xl:w-[160px]",
          isHovered &&
            "right-1/2 translate-x-[400px] translate-y-[-30px] rotate-[15deg] 2xl:translate-x-[500px]"
        )}
        innerClassName="p-2"
      />

      <LogoBox
        imgSrc="/static/home/logos/openrouter.webp"
        className={cn(
          "absolute right-56 top-10 h-28 w-28 rotate-[-16deg] transition-all duration-1000 2xl:h-32 2xl:w-32",
          isHovered && "right-1/2 top-6 translate-x-[200px] rotate-[-76deg]"
        )}
        innerClassName="p-2"
      />

      <LogoBox
        imgSrc="/static/home/logo4.webp"
        className={cn(
          "absolute right-10 top-1/4 h-28 w-28 transition-all duration-1000 2xl:h-32 2xl:w-32",
          isHovered && "right-1/2 top-1/2 translate-x-[550px] rotate-[-45deg]"
        )}
      />
    </div>
  );
};

export default CTA;

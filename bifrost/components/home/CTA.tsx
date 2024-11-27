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
    <div className="bg-[#F2F9FC] h-[80vh] relative overflow-hidden flex flex-col">
      <div
        className="hidden md:block absolute inset-0 w-full h-full z-[0]"
        style={{
          backgroundImage: "url(/static/home/cta-bg.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>

      <div className="flex flex-col justify-center items-center gap-6 md:gap-12 z-[10] h-full w-full relative">
        <div
          className="block md:hidden absolute inset-0 w-full h-full z-[0]"
          style={{
            backgroundImage: "url(/static/home/cta-mobile.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div
          className="block md:hidden absolute inset-0 w-full h-full z-[1]"
          style={{
            backgroundImage: "url(/static/home/cta-mobile.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div className="flex flex-col items-center text-wrap text-4xl md:text-5xl font-semibold text-slate-500 leading-snug z-[10]">
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-center ">
            <div
              className={cn(
                "bg-[#E7F6FD] border-[3px] border-brand rounded-xl py-2 xl:py-4 px-7 text-brand transition-transform duration-1000",
                "rotate-[-3deg]"
              )}
            >
              <h1>Actionable</h1>
            </div>
            <h1>insights</h1>
          </div>
          <h1>starting today</h1>
        </div>
        <Link href="https://us.helicone.ai/signup" className="z-[10]">
          <Button
            size="lg"
            className="lgxl:gap-8 text-base md:text-[40px] py-[18px] md:py-12 px-4 md:px-12 bg-brand hover:bg-brand/100 text-white font-normal rounded-lg md:rounded-2xl z-[10]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Try Helicone for free
            {isHovered && (
              <ChevronRightIcon
                className="w-12 sm:w-5 h-12 sm:h-5"
                strokeWidth={3}
              />
            )}
          </Button>
        </Link>
      </div>
      <div
        className={cn(
          ISLAND_WIDTH,
          "z-[10] flex flex-col md:flex-row justify-between items-start md:items-center gap-y-6 md:gap-y-0 mt-11 md:mt-0 mb-11"
        )}
      >
        <p className="font-medium text-sm md:text-xl">We protect your data.</p>
        <div className="flex items-center gap-12">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <Image
              src="/static/home/soc2.webp"
              alt="SOC 2"
              width={48}
              height={48}
            />
            <p className="text-xs md:text-sm">SOC2 Certified</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
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
          "w-[135px] h-[135px] 2xl:w-[220px] 2xl:h-[220px] absolute 2xl:bottom-44 bottom-28 left-4 rotate-[-27deg] transition-all duration-1000",
          isHovered &&
            "w-[150px] h-[150px] 2xl:w-[200px] 2xl:h-[200px] left-1/2 translate-x-[-380px] 2xl:translate-x-[-600px] bottom-16 rotate-[-27deg]"
        )}
        innerClassName="bg-white"
      />

      <LogoBox
        imgSrc="/static/home/logo2.webp"
        className={cn(
          "w-[115px] h-[115px] 2xl:w-[180px] 2xl:h-[180px] absolute top-1/3 left-44 2xl:left-56 transition-all duration-1000",
          isHovered &&
            "!left-1/2 translate-x-[-450px] 2xl:translate-x-[-500px] translate-y-[50px] rotate-[36deg]"
        )}
      />

      <LogoBox
        imgSrc="/static/home/mistral.webp"
        className={cn(
          "w-[140px] h-[140px] 2xl:w-[180px] 2xl:h-[180px] absolute left-0 top-1/4 -rotate-[25deg] transition-all duration-1000",
          isHovered &&
            "left-1/2 translate-x-[-620px] 2xl:translate-x-[-720px] translate-y-[10px] rotate-[20deg]"
        )}
        innerClassName="bg-white p-2"
      />

      <LogoBox
        imgSrc="/static/home/chatgpt.webp"
        className={cn(
          "w-[170px] h-[170px] 2xl:w-[240px] 2xl:h-[240px] absolute top-0 left-36 2xl:left-48 2xl:p-4 transition-all duration-1000 rounded-[1.9rem] p-3.5",
          isHovered &&
            "!left-1/2 translate-x-[-470px] top-10 2xl:p-4 rotate-[-45deg]"
        )}
        innerClassName="bg-[#0FA37F] rounded-3xl"
      />

      <LogoBox
        imgSrc="/static/home/togetherai.webp"
        className={cn(
          "w-[124px] h-[124px] 2xl:w-[180px] 2xl:h-[180px] absolute top-0 right-4 rotate-[40deg] transition-all duration-1000",
          isHovered &&
            "right-1/2 translate-x-[400px] 2xl:translate-y-[70px] rotate-[-30deg]"
        )}
        innerClassName="rounded-3xl"
      />

      <LogoBox
        imgSrc="/static/home/anthropic.webp"
        className={cn(
          "w-[150px] h-[150px] 2xl:w-[220px] 2xl:h-[220px] absolute bottom-24 right-20 2xl:translate-x-[50px] translate-x-[50px] rotate-[15deg] transition-all duration-1000",
          isHovered &&
            "bottom-20 right-1/2 translate-x-[400px] 2xl:translate-x-[600px] 2xl:translate-y-[-100px] rotate-[40deg]"
        )}
        innerClassName="bg-white p-4"
      />

      <LogoBox
        imgSrc="/static/home/groq.svg"
        className={cn(
          "w-[120px] h-[120px] 2xl:w-[160px] 2xl:h-[160px] absolute top-1/3 2xl:top-1/2 right-56 rotate-[43deg] transition-all duration-1000",
          isHovered &&
            "right-1/2 translate-x-[400px] 2xl:translate-x-[500px] translate-y-[-40px] 2xl:translate-y-[-110px] rotate-[15deg]"
        )}
        innerClassName="bg-white p-2"
      />

      <LogoBox
        imgSrc="/static/home/logo3.webp"
        className={cn(
          "w-28 h-28 2xl:w-40 2xl:h-40 absolute top-10 2xl:top-40 right-56 rotate-[-16deg] transition-all duration-1000",
          isHovered &&
            "top-6 right-1/2 translate-x-[180px] translate-y-[-30px] rotate-[-76deg] 2xl:w-36 2xl:h-36"
        )}
        innerClassName="bg-white p-2"
      />

      <LogoBox
        imgSrc="/static/home/logo4.webp"
        className={cn(
          "w-28 h-28 2xl:w-32 2xl:h-32 absolute top-1/4 right-10 transition-all duration-1000",
          isHovered &&
            "right-1/2 translate-x-[550px] top-1/2 2xl:top-1/4 rotate-[-45deg]"
        )}
      />
    </div>
  );
};

export default CTA;

"use client";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import LogoBox from "./LogoBox";
import { useState } from "react";
import { ISLAND_WIDTH } from "@/app/page";
import Image from "next/image";

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
        <div className="flex flex-col items-center text-4xl md:text-5xl font-semibold text-slate-500 leading-snug z-[10]">
          <div className="flex gap-3 items-center">
            <div
              className={cn(
                "bg-[#E7F6FD] border-2 border-brand rounded-xl py-1 px-7 text-brand translate-y-[-10px] transition-transform duration-500",
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
            className="text-base md:text-[40px] py-[10px] md:py-12 px-4 md:px-8 bg-brand hover:bg-brand/90 text-white font-normal rounded-lg md:rounded-2xl z-[10]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Try Helicone for free
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
          "w-[178px] h-[178px] 2xl:w-[220px] 2xl:h-[220px] absolute bottom-28 left-4 rotate-[-27deg] transition-all duration-500",
          isHovered &&
            "left-1/2 translate-x-[-500px] 2xl:translate-x-[-600px] bottom-8 rotate-[-27deg]"
        )}
        innerClassName="bg-white"
      />

      <LogoBox
        imgSrc="/static/home/logo2.webp"
        className={cn(
          "w-[140px] h-[140px] 2xl:w-[180px] 2xl:h-[180px] absolute top-1/3 left-44 2xl:left-56 transition-all duration-500",
          isHovered &&
            "!left-1/2 translate-x-[-450px] 2xl:translate-x-[-550px] translate-y-[20px] rotate-[17deg]"
        )}
      />

      <LogoBox
        imgSrc="/static/home/mistral.webp"
        className={cn(
          "w-[140px] h-[140px] 2xl:w-[180px] 2xl:h-[180px] absolute left-0 top-1/4 -rotate-[25deg] transition-all duration-500",
          isHovered &&
            "left-1/2 translate-x-[-620px] 2xl:translate-x-[-720px] translate-y-[10px] rotate-[20deg]"
        )}
        innerClassName="bg-white p-2"
      />

      <LogoBox
        imgSrc="/static/home/chatgpt.webp"
        className={cn(
          "w-[194px] h-[194px] 2xl:w-[240px] 2xl:h-[240px] absolute top-0 left-36 2xl:left-48 transition-all duration-500",
          isHovered && "!left-1/2 translate-x-[-400px] rotate-[-45deg]"
        )}
        innerClassName="bg-[#0FA37F] rounded-3xl"
      />

      <LogoBox
        imgSrc="/static/home/togetherai.webp"
        className={cn(
          "w-[142px] h-[142px] 2xl:w-[180px] 2xl:h-[180px] absolute top-0 right-4 rotate-[40deg] transition-all duration-500",
          isHovered && "right-1/2 translate-x-[400px] rotate-[-3deg]"
        )}
        innerClassName="rounded-3xl"
      />

      <LogoBox
        imgSrc="/static/home/anthropic.webp"
        className={cn(
          "w-[176px] h-[176px] 2xl:w-[220px] 2xl:h-[220px] absolute bottom-40 right-20 2xl:translate-x-[50px] translate-x-[50px] rotate-[15deg] transition-all duration-500",
          isHovered &&
            "w-[220px] h-[220px] 2xl:w-[260px] 2xl:h-[260px] bottom-0 right-1/2 translate-x-[460px] 2xl:translate-x-[560px] rotate-[28deg]"
        )}
        innerClassName="bg-white p-4"
      />

      <LogoBox
        imgSrc="/static/home/groq.svg"
        className={cn(
          "w-[135px] h-[135px] 2xl:w-[160px] 2xl:h-[160px] absolute top-1/3 right-56 rotate-[43deg] transition-all duration-500",
          isHovered &&
            "right-1/2 translate-x-[400px] 2xl:translate-x-[500px] translate-y-[-30px] rotate-[15deg]"
        )}
        innerClassName="bg-white p-2"
      />

      <LogoBox
        imgSrc="/static/home/logo3.webp"
        className={cn(
          "w-28 h-28 2xl:w-32 2xl:h-32 absolute top-10 right-56 rotate-[-16deg] transition-all duration-500",
          isHovered && "top-6 right-1/2 translate-x-[200px] rotate-[-76deg]"
        )}
        innerClassName="bg-white p-2"
      />

      <LogoBox
        imgSrc="/static/home/logo4.webp"
        className={cn(
          "w-28 h-28 2xl:w-32 2xl:h-32 absolute top-1/4 right-10 transition-all duration-500",
          isHovered && "right-1/2 translate-x-[550px] top-1/2 rotate-[-45deg]"
        )}
      />
    </div>
  );
};

export default CTA;

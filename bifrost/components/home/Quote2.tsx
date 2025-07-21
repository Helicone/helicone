"use client";

import { cn, ISLAND_WIDTH } from "@/lib/utils";

import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const Quote2 = () => {
  return (
    <div className="bg-[#f2f9fc] pb-14 pt-12 lg:px-16 lg:pb-24">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex flex-col items-center gap-y-8">
          <h2 className="mx-auto w-full max-w-[816px] text-wrap text-center text-2xl font-semibold leading-normal tracking-tight text-[#ACB3BA] md:text-[40px] md:leading-[52px]">
            <span className="hidden md:inline">&ldquo;</span>The{" "}
            <span className="text-black">most impactful one-line change</span>{" "}
            I&apos;ve seen applied to our codebase.
            <span className="hidden md:inline">&rdquo;</span>
          </h2>
          <div className="flex w-full max-w-[816px] items-end justify-center gap-6">
            <Image
              src="/static/home/nishantshukla.webp"
              alt="nishant shukla"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <div className="flex flex-col gap-2">
              <h4 className="whitespace-nowrap text-[17px] font-medium sm:text-xl">
                Nishant Shukla
              </h4>
              <p className="w-auto text-[15px] sm:text-lg">
                Sr. Director of AI
              </p>
            </div>
            <Image
              src="/static/qawolf.webp"
              alt="qawolf"
              width={128}
              height={32}
              className="w-32 pb-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quote2;

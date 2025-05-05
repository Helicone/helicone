"use client";

import { cn, ISLAND_WIDTH } from "@/lib/utils";

import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";


const Quote2 = () => {
  return (
    <div className="px-3 py-12 lg:pb-48 lg:px-16">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex flex-col gap-y-8 justify-between items-center">
          <h2 className="text-2xl md:text-[40px] tracking-tight leading-relaxed md:leading-[52px] font-semibold text-[#ACB3BA] max-w-[816px] text-wrap text-center">
            <span className="hidden md:inline">“</span>Probably{" "}
            <span className="text-accent-foreground">the most impactful one-line change</span>{" "}
            I&apos;ve seen applied to our codebase.
            <span className="hidden md:inline">”</span>
          </h2>
          <div className="flex items-center gap-6">
            <Image
              src="/static/home/nishantshukla.webp"
              alt="nishant shukla"
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <div className="flex flex-col gap-2">
              <h4 className="text-[17px] sm:text-xl font-medium whitespace-nowrap">
                Nishant Shukla
              </h4>
              <p className="text-[15px] sm:text-lg w-auto">
                Sr. Director of AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Quote2;

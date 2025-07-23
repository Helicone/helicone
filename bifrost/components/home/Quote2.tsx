"use client";

import { cn, ISLAND_WIDTH } from "@/lib/utils";

import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const Quote2 = () => {
  return (
    <div className="bg-muted/30 pt-12 pb-14 lg:pb-24 lg:px-16">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex flex-col gap-y-8 items-center">
          <h2 className="text-2xl md:text-[40px] tracking-tight leading-normal md:leading-[52px] font-semibold text-muted-foreground w-full max-w-[816px] text-wrap text-center mx-auto">
            <span className="hidden md:inline">&ldquo;</span>The{" "}
            <span className="text-foreground">most impactful one-line change</span>{" "}
            I&apos;ve seen applied to our codebase.
            <span className="hidden md:inline">&rdquo;</span>
          </h2>
          <div className="flex items-end gap-6 justify-center max-w-[816px] w-full">
            <Image
              src="/static/home/nishantshukla.webp"
              alt="nishant shukla"
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <div className="flex flex-col gap-2">
              <h4 className="text-[17px] sm:text-xl font-medium whitespace-nowrap text-foreground">
                Nishant Shukla
              </h4>
              <p className="text-[15px] sm:text-lg w-auto text-muted-foreground">
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

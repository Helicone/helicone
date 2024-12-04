"use client";

import { cn } from "@/lib/utils";

import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

const Quote2 = () => {
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-y-9 gap-x-12 mb-16 md:mb-36 px-4 sm:px-16 md:px-0">
      <h2 className="text-2xl md:text-[40px] tracking-tight leading-normal md:leading-[52px] font-semibold text-[#ACB3BA] max-w-[816px] text-wrap text-left md:text-center">
        <span className="hidden md:inline">“</span>Probably{" "}
        <span className="text-black">the most impactful one-line change</span>{" "}
        I&apos;ve seen applied to our codebase.
        <span className="hidden md:inline">”</span>
      </h2>

      <div
        className={cn(
          "bg-slate-50 border border-slate-200 px-6 py-3 cursor-pointer max-w-[750px] transition-all duration-300 ease-in-out align-text-top",
          isQuestionOpen ? "rounded-2xl" : "rounded-[24px]"
        )}
        onClick={() => setIsQuestionOpen(!isQuestionOpen)}
      >
        <div
          className={cn(
            "flex justify-between items-center transition-all duration-300"
          )}
        >
          <p className="text-sm sm:text-lg">
            What if I don't want Helicone to be in my critical path?{" "}
          </p>
          <div className="transition-transform duration-300">
            {isQuestionOpen ? (
              <XIcon className="h-4 w-4 rotate-0" />
            ) : (
              <PlusIcon className="h-4 w-4 rotate-0" />
            )}
          </div>
        </div>
        <div
          className={cn(
            "grid transition-all duration-300",
            isQuestionOpen
              ? "grid-rows-[1fr] opacity-100 mt-4"
              : "grid-rows-[0fr] opacity-0 mt-0"
          )}
        >
          <div className="overflow-hidden">
            <p className="text-sm sm:text-lg font-light text-gray-400">
              There are two ways to interface with Helicone - Proxy and Async.
              You can integrate with Helicone using the async integration to
              ensure zero propagation delay, or choose proxy for the simplest
              integration and access to gateway features like caching, rate
              limiting, API key management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quote2;

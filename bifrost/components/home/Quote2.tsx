"use client";

import { cn } from "@/lib/utils";

import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

const Quote2 = () => {
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-12 mb-36">
      <h2 className="text-lg md:text-[40px] tracking-tight leading-normal md:leading-[52px] font-semibold text-[#ACB3BA] max-w-[816px] text-wrap text-center">
        “Probably{" "}
        <span className="text-black">the most impactful one-line change</span>{" "}
        I’ve seen applied to our codebase.”
      </h2>

      <div
        className={cn(
          "bg-slate-50 border border-slate-200 px-6 py-3 cursor-pointer max-w-[750px] transition-all duration-300 ease-in-out",
          isQuestionOpen ? "rounded-2xl" : "rounded-[100px]"
        )}
        onClick={() => setIsQuestionOpen(!isQuestionOpen)}
      >
        <div
          className={cn(
            "flex gap-2.5 items-center transition-all duration-300",
            isQuestionOpen && "justify-between"
          )}
        >
          <p className="text-lg">
            What if I don’t want Helicone to be in my critical path.{" "}
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
            <p className="text-lg text-[#ACB3BA]">
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

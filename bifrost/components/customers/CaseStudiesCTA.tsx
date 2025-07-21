import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { ISLAND_WIDTH } from "@/lib/utils";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export const CaseStudiesCTA = () => {
  return (
    <div className="relative flex h-[80vh] flex-col overflow-hidden bg-gradient-to-b from-white to-[#F2F9FC]">
      <div className="relative z-[10] flex h-full w-full flex-col items-center justify-center gap-6 md:gap-12">
        <div className="z-[10] flex flex-col items-center text-wrap text-4xl font-semibold leading-snug text-slate-500 md:text-5xl">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <div
              className={cn(
                "border-brand text-brand rounded-2xl border-[3px] bg-[#E7F6FD] px-4 py-2 text-3xl transition-transform duration-1000 sm:px-7 sm:text-4xl md:text-5xl xl:py-4",
                "rotate-[-3deg]"
              )}
            >
              <h2>Actionable</h2>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">insights</h2>
            <h2 className="w-full text-center text-3xl sm:text-4xl md:text-5xl">
              for your AI applications
            </h2>
          </div>
        </div>
        <Link href="https://us.helicone.ai/signup" className="z-[10]">
          <Button
            size="lg"
            className="bg-brand hover:bg-brand/90 mx-auto flex items-center gap-2 rounded-lg px-6 py-8 text-2xl font-medium text-white sm:px-9"
          >
            Try Helicone for free
            <ChevronRight />
          </Button>
        </Link>
      </div>

      {/* SOC 2 & HIPAA */}
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
    </div>
  );
};

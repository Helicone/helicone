import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { ISLAND_WIDTH } from "@/lib/utils";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export const CaseStudiesCTA = () => {
  return (
    <div className="bg-gradient-to-b from-white to-[#F2F9FC] h-[80vh] relative overflow-hidden flex flex-col">
      <div className="flex flex-col justify-center items-center gap-6 md:gap-12 z-[10] h-full w-full relative">
        <div className="flex flex-col items-center text-wrap text-4xl md:text-5xl font-semibold text-slate-500 leading-snug z-[10]">
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-center">
            <div
              className={cn(
                "bg-[#E7F6FD] border-[3px] border-brand rounded-2xl py-2 xl:py-4 px-4 sm:px-7 text-brand transition-transform duration-1000 text-3xl sm:text-4xl md:text-5xl",
                "rotate-[-3deg]",
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
            className="mx-auto font-medium py-8 px-6 sm:px-9 text-2xl bg-brand hover:bg-brand/90 text-white rounded-lg flex items-center gap-2"
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
          "z-[10] flex flex-col md:flex-row justify-between items-start md:items-center gap-y-6 md:gap-y-0 mt-11 md:mt-0 mb-11",
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
    </div>
  );
};

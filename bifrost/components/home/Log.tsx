import { ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";

const Log = () => {
  return (
    <div className="w-full pl-4 sm:pl-16 md:pl-24 2xl:pl-40 max-w-[2000px] mx-auto pt-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
        <div className="flex flex-col gap-9 pr-4 sm:pr-0">
          <div className="flex items-center gap-2.5">
            <p className="text-base sm:text-xl">02</p>
            <div className="text-base sm:text-lg font-medium text-slate-700">
              Debug
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="font-semibold text-4xl sm:text-5xl leading-[120%] max-w-[600px] text-wrap text-black">
              Inspect every run <span className="text-brand">in seconds</span>
            </h2>
            <p className="text-lg max-w-[520px] text-landing-description font-light leading-relaxed">
              Agents fail in unpredictable ways. Trace sessions to see exactly which step broke, which tool was called, and it returned.
            </p>
            <div className="inline-flex">
              <Link
                href="https://docs.helicone.ai/features/sessions"
                target="_blank"
                rel="noopener"
              >
                <Button
                  variant="landing_primary"
                  size="landing_page"
                  className="bg-brand p-5 text-base md:text-lg md:py-4 lg:py-6 lg:px-6 lg:text-md gap-2 rounded-lg items-center z-[10]"
                >
                  Start tracing
                  <ArrowUpRight className="size-5 md:size-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Image
          src="/static/home/log.webp"
          alt="Log"
          width={1000}
          height={1000}
        />
      </div>
    </div>
  );
};

export default Log;

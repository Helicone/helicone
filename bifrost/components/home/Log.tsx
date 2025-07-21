import { ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";

const Log = () => {
  return (
    <div className="mx-auto w-full max-w-[2000px] pl-4 pt-24 sm:pl-16 md:pl-24 2xl:pl-40">
      <div className="grid grid-cols-1 gap-y-8 md:grid-cols-2">
        <div className="flex flex-col gap-9 pr-4 sm:pr-0">
          <div className="flex items-center gap-2.5">
            <p className="text-base sm:text-xl">02</p>
            <div className="text-base font-medium text-slate-700 sm:text-lg">
              Debug
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="max-w-[600px] text-wrap text-4xl font-semibold leading-[120%] text-black sm:text-5xl">
              Trace and debug your agent with ease
            </h2>
            <p className="text-landing-description max-w-[520px] text-lg font-light leading-relaxed">
              Visualize your multi-step LLM interactions, log requests in
              real-time, and pinpoint the root cause of errors.
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
                  className="bg-brand lg:text-md z-[10] items-center gap-2 rounded-lg p-5 text-base md:py-4 md:text-lg lg:px-6 lg:py-6"
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

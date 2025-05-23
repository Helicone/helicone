import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Quote = () => {
  return (
    <div>
      <div className={cn(ISLAND_WIDTH)}>
        <div className="relative border-t border-l border-slate-200 p-10 lg:p-16 rounded-tl-md bg-white">
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-slate-300 bg-white"></div>

          <div className="flex flex-col gap-y-8 lg:flex-row justify-between items-start lg:items-end">
            <h2 className="text-2xl md:text-[40px] tracking-tight leading-normal md:leading-[52px] font-semibold text-[#ACB3BA] w-full lg:max-w-[780px] text-wrap lg:mr-20">
              The ability to test prompt variations on production traffic
              without touching a line of code is magical.{" "}
              <span className="text-black">
                It feels like we&apos;re cheating; it&apos;s just that good!
              </span>
            </h2>
            <div className="flex items-end gap-6">
              <Image
                src="/static/home/nishantshukla.webp"
                alt="nishant shukla"
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <div className="flex flex-col gap-2">
                <Image
                  src="/static/qawolf.webp"
                  alt="qawolf"
                  width={128}
                  height={32}
                  className="w-32 pb-2"
                />
                <h4 className="text-[17px] sm:text-xl font-medium whitespace-nowrap">
                  Nishant Shukla
                </h4>
                <p className="text-[15px] sm:text-lg w-auto">
                  Sr. Director of AI
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-slate-300 bg-white"></div>
        </div>
      </div>
    </div>
  );
};

export default Quote;

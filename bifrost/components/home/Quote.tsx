import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Quote = () => {
  return (
    <div className="bg-[#f2f9fc] pt-20 pb-16 lg:pb-40 lg:px-16">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex flex-col gap-y-8 lg:flex-row justify-between items-start lg:items-end">
          <h2 className="text-2xl md:text-[40px] tracking-tight leading-normal md:leading-[52px] font-semibold text-[#ACB3BA] w-full lg:max-w-[780px] text-wrap lg:mr-20">
            Thank you for an excellent observability platform!{" "}
            <span className="text-black">
              I use it for all of my AI applications now.
            </span>
          </h2>
          <div className="flex flex-row items-end gap-6">
            <Image
              src="/static/home/hassan.webp"
              alt="Hassan El Mghari"
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <div className="flex flex-col gap-2">
              <h4 className="text-[17px] sm:text-xl font-medium whitespace-nowrap">
                Hassan El Mghari
              </h4>
              <p className="text-[12px] sm:text-base w-auto">
                Director of Developer Relations
              </p>
            </div>
            <Image
              src="/static/togetherai.webp"
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

export default Quote;

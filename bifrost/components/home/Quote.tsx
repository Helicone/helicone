import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Quote = () => {
  return (
    <div className="bg-[#f2f9fc] pb-16 pt-20 lg:px-16 lg:pb-40">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex flex-col items-start justify-between gap-y-8 lg:flex-row lg:items-end">
          <h2 className="w-full text-wrap text-2xl font-semibold leading-normal tracking-tight text-[#ACB3BA] md:text-[40px] md:leading-[52px] lg:mr-20 lg:max-w-[780px]">
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
              className="h-12 w-12"
            />
            <div className="flex flex-col gap-2">
              <h4 className="whitespace-nowrap text-[17px] font-medium sm:text-xl">
                Hassan El Mghari
              </h4>
              <p className="w-auto text-[12px] sm:text-base">
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

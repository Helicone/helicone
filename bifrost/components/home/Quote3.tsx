import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Quote3 = () => {
  return (
    <div className="bg-white pb-20 pt-10 sm:bg-gradient-to-b sm:from-white sm:to-[#F2F9FC] sm:pb-40">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex flex-col items-start justify-between gap-y-9 lg:flex-row lg:items-end">
          <h2 className="mr-20 w-full text-wrap text-2xl font-semibold leading-normal tracking-tight text-[#ACB3BA] md:text-[40px] md:leading-[52px] lg:max-w-[780px]">
            Helicone is{" "}
            <span className="text-black">
              essential for debugging our complex agentic flows
            </span>{" "}
            for AI code reviews. Can&apos;t imagine building without it.
          </h2>
          <div className="flex items-end gap-6">
            <Image
              src="/static/home/logos/soohoon.webp"
              alt="Soohoon Choi"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full"
            />
            <div className="flex flex-col gap-2">
              <Image
                src="/static/greptile.webp"
                alt="Greptile"
                width={112}
                height={28}
                className="w-28 pb-2"
              />
              <h4 className="whitespace-nowrap text-[17px] font-medium sm:text-xl">
                Soohoon Choi
              </h4>
              <p className="w-auto text-[15px] sm:text-lg">CTO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quote3;

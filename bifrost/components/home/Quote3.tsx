import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Quote3 = () => {
  return (
    <div className="bg-white sm:bg-gradient-to-b sm:from-white sm:to-[#F2F9FC] pt-10 pb-20 sm:pb-40">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex flex-col gap-y-9 lg:flex-row justify-between items-start lg:items-end">
          <h2 className="text-2xl md:text-[40px] tracking-tight leading-normal md:leading-[52px] font-semibold text-[#ACB3BA] w-full lg:max-w-[780px] text-wrap mr-20">
            Helicone is{" "}
            <span className="text-black">
              essential for debugging our complex agentic flows
            </span>{" "}
            for AI code reviews. Can't imagine building without it.
          </h2>
          <div className="flex items-end gap-6">
            <Image
              src="/static/home/logos/soohoon.webp"
              alt="Soohoon Choi"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex flex-col gap-2">
              <Image
                src="/static/greptile.webp"
                alt="Greptile"
                width={112}
                height={28}
                className="w-28 pb-2"
              />
              <h4 className="text-[17px] sm:text-xl font-medium whitespace-nowrap">
                Soohoon Choi
              </h4>
              <p className="text-[15px] sm:text-lg w-auto">CTO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quote3;

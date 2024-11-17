import { ISLAND_WIDTH } from "@/app/page";
import { cn } from "@/lib/utils";

const Quote = () => {
  return (
    <div className="bg-[#f2f9fc] pt-12 pb-48 px-16">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex justify-between items-end">
          <h2 className="text-lg md:text-[40px] tracking-tight leading-normal md:leading-[52px] font-semibold text-[#ACB3BA] max-w-[780px] text-wrap mr-20">
            The ability to test prompt variations on production traffic without
            touching a line of code is magical.{" "}
            <span className="text-black">
              It feels like we’re cheating; it’s just that good!
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            <img src="/static/qawolf.webp" alt="qawolf" className="w-36" />
            <div className="flex items-center gap-6">
              <img
                src="/static/home/nishantshukla.webp"
                alt="nishant shukla"
                className="w-12 h-12"
              />
              <div className="flex flex-col gap-1 text-[#5D6673]">
                <h4 className="text-xl font-medium">Nishant Shukla</h4>
                <p className="text-lg">Sr. Director of AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quote;

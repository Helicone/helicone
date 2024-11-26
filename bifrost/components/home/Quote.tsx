import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";

const Quote = () => {
  return (
    <div className="bg-[#f2f9fc] pt-12 pb-20 lg:pb-48 lg:px-16">
      <div className={cn(ISLAND_WIDTH)}>
        <div className="flex flex-col gap-y-8 lg:flex-row justify-between items-start lg:items-end">
          <h2 className="text-2xl md:text-[40px] tracking-tight leading-normal md:leading-[52px] font-semibold text-[#ACB3BA] w-full lg:max-w-[780px] text-wrap lg:mr-20">
            The ability to test prompt variations on production traffic without
            touching a line of code is magical.{" "}
            <span className="text-black">
              It feels like we're cheating; it's just that good!
            </span>
          </h2>
          {/* <div className="flex flex-col gap-3"> */}
          <div className="flex items-end gap-6">
            <img
              src="/static/home/nishantshukla.webp"
              alt="nishant shukla"
              className="w-12 h-12"
            />
            <div className="flex flex-col gap-2">
              <img
                src="/static/qawolf.webp"
                alt="qawolf"
                className="w-24 pb-2"
              />
              <h4 className="text-[13px] sm:text-xl font-medium whitespace-nowrap">
                Nishant Shukla
              </h4>
              <p className="text-[11px] sm:text-lg w-auto">Sr. Director of AI</p>
            </div>
          </div>
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default Quote;

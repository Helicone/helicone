import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import leftGraphic from "@/public/static/footer-graphic-L.png";
import rightGraphic from "@/public/static/footer-graphic-R.png";

export default function LandingFooterGraphic() {
  return (
    <div className="flex flex-col w-full items-center bg-[#2B3AC7] text-white text-center">
      <div className="flex flex-row w-full items-center justify-between">
        <Image
          src={leftGraphic}
          alt="Helicone"
          className="hidden md:block w-1/3"
        />

        <div className="flex flex-col items-center gap-8 xl:gap-4 mx-auto my-12 xl:my-0 ">
          <h2 className="text-lg md:text-2xl lg:text-5xl font-bold">
            Getting started with Helicone is simple and fun
          </h2>
          <p className="text-xs md:text-sm lg:text-lg text-[#D0DEE8] font-light">
            Join users from all over the world that use Helicone to supercharge
            their AI workflow.
          </p>

          <div className="flex flex-row items-center gap-4 font-bold mt-6">
            <a
              href="https://us.helicone.ai/signup?demo=true"
              className="text-xs md:text-sm lg:text-lg text-[#2B3AC7] pl-4 pr-2 py-1 rounded-lg border border-white hover:border-[#D0DEE8] transition-colors duration-200 bg-white hover:bg-[#D0DEE8]"
            >
              Get a Demo
            </a>
            <a
              href="https://us.helicone.ai/signup"
              className="flex flex-row items-center gap-1 text-xs md:text-sm lg:text-lg px-4 py-1 rounded-lg border hover:text-[#D0DEE8] border-white hover:border-[#D0DEE8] transition-colors duration-200"
            >
              <p>Start for Free</p>
              <ChevronRightIcon className="w-4 h-4 font-bold stroke-2" />
            </a>
          </div>
        </div>

        <Image
          src={rightGraphic}
          alt="Helicone"
          className="hidden md:block w-1/3"
        />
      </div>
    </div>
  );
}

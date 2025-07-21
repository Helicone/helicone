import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import leftGraphic from "@/public/static/footer-graphic-L.png";
import rightGraphic from "@/public/static/footer-graphic-R.png";

export default function LandingFooterGraphic() {
  return (
    <div className="flex w-full flex-col items-center bg-[#2B3AC7] text-center text-white">
      <div className="flex w-full flex-row items-center justify-between">
        <Image
          src={leftGraphic}
          alt="Helicone"
          className="hidden w-1/3 md:block"
        />

        <div className="mx-auto my-12 flex flex-col items-center gap-8 xl:my-0 xl:gap-4">
          <h2 className="text-lg font-bold md:text-2xl lg:text-5xl">
            Getting started with Helicone is simple and fun
          </h2>
          <p className="text-xs font-light text-[#D0DEE8] md:text-sm lg:text-lg">
            Join users from all over the world that use Helicone to supercharge
            their AI workflow.
          </p>

          <div className="mt-6 flex flex-row items-center gap-4 font-bold">
            <a
              href="https://us.helicone.ai/signup?demo=true"
              className="rounded-lg border border-white bg-white py-1 pl-4 pr-2 text-xs text-[#2B3AC7] transition-colors duration-200 hover:border-[#D0DEE8] hover:bg-[#D0DEE8] md:text-sm lg:text-lg"
            >
              Get a Demo
            </a>
            <a
              href="https://us.helicone.ai/signup"
              className="flex flex-row items-center gap-1 rounded-lg border border-white px-4 py-1 text-xs transition-colors duration-200 hover:border-[#D0DEE8] hover:text-[#D0DEE8] md:text-sm lg:text-lg"
            >
              <p>Start for Free</p>
              <ChevronRightIcon className="h-4 w-4 stroke-2 font-bold" />
            </a>
          </div>
        </div>

        <Image
          src={rightGraphic}
          alt="Helicone"
          className="hidden w-1/3 md:block"
        />
      </div>
    </div>
  );
}

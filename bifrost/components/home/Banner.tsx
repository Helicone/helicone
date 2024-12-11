import { cn } from "@/lib/utils";
import Link from "next/link";

const Banner = () => {
  return (
    <div
      className={cn("flex flex-col justify-center w-full h-auto pb-4 relative")}
    >
      <div className="bg-slate-100 text-slate-500 text-center text-sm md:text-base py-3 w-full">
        <p>
          🎁 Our holiday gift to you:{" "}
          <Link
            href="https://docs.helicone.ai/features/experiments"
            className="font-semibold underline hover:text-slate-600"
          >
            Experiments
          </Link>{" "}
          is here!
        </p>
      </div>
    </div>
  );
};

export default Banner;

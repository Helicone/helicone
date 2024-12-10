import { cn } from "@/lib/utils";

const Banner = () => {
  return (
    <div
      className={cn("flex flex-col justify-center w-full h-auto pb-4 relative")}
    >
      <div className="bg-slate-100 text-slate-500 text-center text-sm md:text-base py-3 w-full">
        <p>
          🎁 Our holiday gift to you:{" "}
          <a
            href="https:/docs.helicone.ai/experiments"
            className="font-semibold underline hover:text-slate-600"
          >
            Experiments
          </a>{" "}
          is here!
        </p>
      </div>
    </div>
  );
};

export default Banner;

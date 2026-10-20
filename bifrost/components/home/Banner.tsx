import { cn } from "@/lib/utils";

const Banner = () => {
  return (
    <div
      className={cn("flex flex-col justify-center w-full h-auto relative")}
    >
      <div className="bg-sky-500 text-blue-50 text-sm md:text-base py-2.5 w-full">
        <div className="flex items-center justify-center gap-2 px-4">
          <p className="text-center font-medium">
            Helicone is no longer part of Mintlify. Details to come soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Banner;

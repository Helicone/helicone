import { cn } from "@/lib/utils";

const Banner = () => {
  return (
    <div className={cn("flex flex-col justify-center w-full h-auto relative")}>
      <div className="bg-sky-500 text-blue-50 text-sm md:text-base py-2.5 w-full">
        <div className="flex items-center justify-center gap-2 px-4">
          <p className="text-center font-medium">
            Helicone is now part of{" "}
            <a
              href="https://www.experientiallabs.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white"
            >
              Experiential Labs
            </a>
            . Details to come soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Banner;

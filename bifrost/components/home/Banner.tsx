import { cn } from "@/lib/utils";
import Link from "next/link";

const Banner = () => {
  return (
    <div
      className={cn("flex flex-col justify-center w-full h-auto pb-4 relative")}
    >
      <div className="bg-blue-600 text-blue-50 text-center text-sm md:text-base py-3 w-full">
        <p>
          🔥 Introducing the{" "}
          <Link
            href="https://helicone.ai/blog/introducing-ai-gateway"
            className="font-medium underline hover:text-blue-200"
          >
            Helicone AI Gateway
          </Link>{" "}
          (in beta) - reach 100+ models with a single integration.
        </p>
      </div>
    </div>
  );
};

export default Banner;

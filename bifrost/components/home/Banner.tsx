import { cn } from "@/lib/utils";
import Link from "next/link";

const Banner = () => {
  return (
    <div
      className={cn("relative flex h-auto w-full flex-col justify-center pb-4")}
    >
      <div className="w-full bg-sky-500 py-3 text-center text-sm text-blue-50 md:text-base">
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

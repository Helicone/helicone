import { cn } from "@/lib/utils";
import Link from "next/link";

const Banner = () => {
  return (
    <div
      className={cn("flex flex-col justify-center w-full h-auto pb-4 relative")}
    >
      <div className="bg-sky-500 text-blue-50 text-center text-sm md:text-base py-3 w-full">
        <p>
          🔥 Introducing the{" "}
          <Link
            href="https://www.helicone.ai/blog/ptb-gateway-launch"
            className="font-medium underline hover:text-blue-200"
          >
            Helicone AI Gateway
          </Link>
          , now on the cloud with passthrough billing. Access 100+ models with 1
          API and 0% markup.
        </p>
      </div>
    </div>
  );
};

export default Banner;

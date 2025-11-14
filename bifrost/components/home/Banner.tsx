import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

const Banner = () => {
  return (
    <div className={cn("hidden md:flex flex-col justify-center w-full h-auto relative")}>
      <div className="bg-sky-500 text-blue-50 text-sm md:text-base py-3 w-full">
        <div className="flex items-center justify-center gap-4 px-4 flex-wrap">
          <p className="text-center">
            🔥 The{" "}
            <Link
              href="https://www.producthunt.com/products/helicone-ai"
              className="font-medium underline hover:text-blue-200"
            >
              Helicone AI Gateway
            </Link>{" "}
            is now available to everyone! Access 100+ models with 1 API and 0%
            markup fees.
          </p>
          <a
            href="https://www.producthunt.com/products/helicone-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-helicone&#0045;ai&#0045;2"
            target="_blank"
            className="flex-shrink-0"
          >
            <Image
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1034536&theme=light&t=1762382367758"
              alt="Helicone&#0046;ai - The&#0032;open&#0045;source&#0032;AI&#0032;gateway&#0032;for&#0032;AI&#0045;native&#0032;startups | Product Hunt"
              width={120}
              height={26}
              className="h-auto"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Banner;

import { cn } from "@/lib/utils";
import Link from "next/link";

const Banner = () => {
  return (
    <div
      className={cn("flex flex-col justify-center w-full h-auto pb-4 relative")}
    >
      <div className="bg-blue-600 text-blue-50 text-center text-sm md:text-base py-3 w-full">
        <p>
          🔥{" "}
          <Link
            href="https://news.ycombinator.com/newest"
            className="font-medium underline hover:text-blue-200"
          >
            We&apos;re on HackerNews
          </Link>
          ! If Helicone has helped you, we&apos;d love to get your thoughts and
          support.
        </p>
      </div>
    </div>
  );
};

export default Banner;

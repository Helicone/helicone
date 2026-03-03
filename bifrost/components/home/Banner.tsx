import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Banner = () => {
  return (
    <Link
      href="/blog/joining-mintlify"
      className={cn(
        "flex flex-col justify-center w-full h-auto relative group"
      )}
    >
      <div className="bg-sky-500 text-blue-50 text-sm md:text-base py-2.5 w-full">
        <div className="flex items-center justify-center gap-2 px-4">
          <p className="text-center font-medium">
            🎉 Helicone Joins Mintlify 🚀
          </p>
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
};

export default Banner;

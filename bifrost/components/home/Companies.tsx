import { cn } from "@/lib/utils";
import Image from "next/image";

interface CompaniesProps {
  className?: string;
}

const Companies = ({ className }: CompaniesProps) => {
  return (
    <div className={cn("py-16", className)}>
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-md mb-8 text-center">
          1000+ AI teams use Helicone to build reliable products
        </p>
        <div className="grid grid-cols-2 items-center justify-items-center gap-8 md:grid-cols-4 lg:grid-cols-8">
          {(
            [
              ["/static/togetherai.webp", "togetherai", 169, 53],
              ["/static/qawolf.webp", "qawolf", 157, 53],
              ["/static/home/clay.webp", "clay", 150, 53],
              ["/static/home/logos/sia.webp", "Singapore Airlines", 132, 53],
              ["/static/home/duolingo2.png", "duolingo", 240, 53],
              ["/static/sunrun.webp", "sunrun", 132, 53],
              ["/static/filevine.webp", "filevine", 130, 53],
              ["/static/home/logos/podpitch.webp", "podpitch", 132, 53],
            ] as const
          ).map((src, index) => (
            <div
              key={index}
              className="flex items-center justify-center opacity-50 grayscale transition-opacity duration-300 hover:opacity-70"
            >
              <Image
                src={src[0]}
                alt={src[1]}
                width={src[2]}
                height={src[3]}
                className="h-auto max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Companies;

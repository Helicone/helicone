import { cn } from "@/lib/utils";
import Image from "next/image";

interface CompaniesLandingProps {
  className?: string;
}

const CompaniesLanding = ({ className }: CompaniesLandingProps) => {
  return (
    <div className={cn("w-full py-12", className)}>
      <div className="flex flex-col gap-6">
        <h3 className="text-center text-lg font-medium text-muted-foreground">
          Trusted by innovative teams
        </h3>
        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 grayscale opacity-40">
            {(
              [
                ["/static/togetherai.webp", "togetherai", 169, 53],
                ["/static/qawolf.webp", "qawolf", 157, 53],
                ["/static/home/clay.webp", "clay", 150, 53],
                ["/static/home/axiom.webp", "axiom", 132, 53],
                ["/static/home/duolingo2.png", "duolingo", 240, 53],
                ["/static/sunrun.webp", "sunrun", 132, 53],
                ["/static/filevine.webp", "filevine", 130, 53],
                ["/static/home/hear.webp", "hear.com", 92, 53],
              ] as const
            ).map((src, index) => (
              <div
                key={index}
                className="flex items-center justify-center p-6 border-b border-r border-slate-200 last:border-r-0 md:last-of-type:border-r md:nth-last-of-type(-n+4):border-b-0 md:nth-of-type(4n):border-r-0"
              >
                <Image
                  src={src[0]}
                  alt={src[1]}
                  width={src[2]}
                  height={src[3]}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesLanding;

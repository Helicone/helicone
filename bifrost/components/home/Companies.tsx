import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CompaniesProps {
  className?: string;
}

const Companies = ({ className }: CompaniesProps) => {
  return (
    <div className={cn("pb-12", className)}>
      <div className={cn(ISLAND_WIDTH, "flex flex-col gap-4 ")}>
        {/* <ul className="grid grid-cols-4 lg:grid-cols-8 gap-8 md:gap-12 px-2 md:px-8 grayscale opacity-40 items-center"> */}
        <ul className="grid grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-8 px-2 md:px-8 grayscale opacity-40 items-center">
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
            <li className="flex items-center justify-center p-2" key={index}>
              <Image
                src={src[0]}
                alt={src[1]}
                width={src[2]}
                height={src[3]}
                objectFit="contain"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Companies;

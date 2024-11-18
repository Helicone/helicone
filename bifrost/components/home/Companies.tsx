import { ISLAND_WIDTH } from "@/app/page";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Companies = () => {
  return (
    <div className="bg-[#f2f9fc] pb-12">
      <div className={cn(ISLAND_WIDTH, "flex flex-col gap-4 ")}>
        <ul className="grid grid-cols-4 lg:grid-cols-8 gap-8 md:gap-12 px-4 md:px-8 grayscale opacity-40 items-center">
          {(
            [
              ["/static/qawolf.webp", "qawolf", 99, 33],
              ["/static/sunrun.webp", "sunrun", 83, 33],
              ["/static/filevine.webp", "filevine", 81, 33],
              ["/static/slate.webp", "slate", 65, 33],
              ["/static/mintlify.svg", "mintlify", 94, 33],
              ["/static/upenn.webp", "upenn", 83, 33],
              ["/static/togetherai.webp", "togetherai", 106, 33],
              ["/static/swiss.webp", "swiss red cross", 150, 33],
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

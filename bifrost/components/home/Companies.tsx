import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Companies = () => {
  return (
    <div className="bg-[#f2f9fc] pb-12">
      <div className={cn(ISLAND_WIDTH, "flex flex-col gap-4 ")}>
        {/* <ul className="grid grid-cols-4 lg:grid-cols-8 gap-8 md:gap-12 px-2 md:px-8 grayscale opacity-40 items-center"> */}
        <ul className="grid grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-8 px-2 md:px-8 grayscale opacity-40 items-center">
          {(
            [
              ["/static/qawolf.webp", "qawolf", 119, 40],
              ["/static/sunrun.webp", "sunrun", 100, 40],
              ["/static/filevine.webp", "filevine", 98, 40],
              ["/static/slate.webp", "slate", 78, 40],
              ["/static/mintlify.svg", "mintlify", 113, 40],
              ["/static/upenn.webp", "upenn", 100, 40],
              ["/static/togetherai.webp", "togetherai", 128, 40],
              ["/static/swiss.webp", "swiss red cross", 181, 40],
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

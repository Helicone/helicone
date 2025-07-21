import { cn } from "@/lib/utils";
import Image from "next/image";

const LogoBox = ({
  className,
  innerClassName,
  imgSrc,
}: {
  className?: string;
  innerClassName?: string;
  imgSrc: string;
}) => {
  return (
    <div
      className={cn(
        "hidden rounded-2xl border-2 border-white bg-[#E2F1FD66] p-3 shadow-xl lg:block 2xl:p-3.5",
        className
      )}
    >
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-2xl",
          innerClassName
        )}
      >
        <Image
          src={imgSrc}
          alt="Logo"
          className="h-full w-full rounded-2xl object-contain"
          width={100}
          height={100}
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default LogoBox;

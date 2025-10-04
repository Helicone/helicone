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
        "bg-[#E2F1FD66] rounded-2xl p-3 2xl:p-3.5 shadow-xl hidden lg:block border-2 border-white",
        className,
      )}
    >
      <div
        className={cn(
          "w-full h-full flex items-center justify-center rounded-2xl",
          innerClassName,
        )}
      >
        <Image
          src={imgSrc}
          alt="Logo"
          className="w-full h-full object-contain rounded-2xl"
          width={100}
          height={100}
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default LogoBox;

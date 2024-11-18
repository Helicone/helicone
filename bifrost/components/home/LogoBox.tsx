import { cn } from "@/lib/utils";

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
        "bg-[#E2F1FD66] rounded-3xl p-2.5 2xl:p-3.5 shadow-xl hidden lg:block",
        className
      )}
    >
      <div
        className={cn(
          "w-full h-full flex items-center justify-center rounded-2xl",
          innerClassName
        )}
      >
        <img
          src={imgSrc}
          alt="Logo"
          className="w-full h-full object-contain rounded-2xl"
        />
      </div>
    </div>
  );
};

export default LogoBox;

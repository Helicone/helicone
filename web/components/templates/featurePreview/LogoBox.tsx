import { cn } from "@/lib/utils";

const LogoBox = ({
  className,
  innerClassName,
  imgSrc,
  size = "medium",
}: {
  className?: string;
  innerClassName?: string;
  imgSrc: string;
  size?: "small" | "medium" | "large";
}) => {
  return (
    <div
      className={cn(
        "bg-[#ECF6FC] rounded-3xl shadow-xl hidden lg:block border border-white",
        {
          "p-2": size === "small",
          "p-2.5": size === "medium",
          "p-3": size === "large",
        },
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

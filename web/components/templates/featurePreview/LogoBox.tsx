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
        "hidden rounded-3xl border border-white bg-[#ECF6FC] shadow-xl lg:block",
        {
          "p-2": size === "small",
          "p-2.5": size === "medium",
          "p-3": size === "large",
        },
        className,
      )}
    >
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-2xl",
          innerClassName,
        )}
      >
        <img
          src={imgSrc}
          alt="Logo"
          className="h-full w-full rounded-2xl object-contain"
        />
      </div>
    </div>
  );
};

export default LogoBox;

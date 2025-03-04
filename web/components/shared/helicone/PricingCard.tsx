import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  priceSubtext?: string;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  isBestValue?: boolean;
  variant?: "default" | "highlighted" | "outlined";
  iconSrc?: string;
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export const PricingCard = ({
  title,
  price,
  priceSubtext,
  isCurrentPlan = false,
  isPopular = false,
  isBestValue = false,
  variant = "default",
  iconSrc,
  className,
  onClick,
  isLoading,
}: PricingCardProps) => {
  const variants = {
    default: {
      container: "bg-[hsl(var(--sidebar-accent))]",
      title: "text-[hsl(var(--sidebar-accent-foreground))]",
      price: "text-[hsl(var(--sidebar-accent-foreground))]",
      badge:
        "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="7.5" fill="currentColor" />
          <path
            d="M7.5 10L9.16667 11.6667L12.5 8.33334"
            stroke="white"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    highlighted: {
      container:
        "bg-[hsl(var(--primary)/0.1)] border-2 border-[hsl(var(--primary))]",
      title: "text-[hsl(var(--primary))]",
      price: "text-[hsl(var(--primary))]",
      badge:
        "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-2 border-[hsl(var(--primary))] rounded-full",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.83334 14.1667L14.1667 5.83334M14.1667 5.83334H7.50001M14.1667 5.83334V12.5"
            stroke="currentColor"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    outlined: {
      container: "bg-[hsl(var(--card))] border-2 border-[hsl(var(--border))]",
      title: "text-[hsl(var(--foreground))]",
      price: "text-[hsl(var(--foreground))]",
      badge:
        "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-2 border-[hsl(var(--border))] rounded-full",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.83334 14.1667L14.1667 5.83334M14.1667 5.83334H7.50001M14.1667 5.83334V12.5"
            stroke="currentColor"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  };

  const styles = variants[variant];

  return (
    <div
      className={cn(
        "h-full w-full flex flex-col px-6 py-3 rounded-xl gap-2",
        styles.container,
        onClick &&
          "cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="flex w-full justify-between items-center">
        <div
          className={cn("text-xl font-semibold leading-normal", styles.title)}
        >
          {isLoading ? "Loading..." : title}
        </div>
        {iconSrc ? (
          <div className="w-6 h-6 relative overflow-hidden">
            <img
              className="w-5 h-5 left-0 top-0 absolute"
              src={iconSrc}
              alt={`${title} icon`}
            />
          </div>
        ) : (
          <div className={cn("w-5 h-5 text-current", styles.title)}>
            {styles.icon}
          </div>
        )}
      </div>
      <div className="flex w-full flex-wrap gap-2 justify-between items-center">
        <div className={cn("flex items-baseline flex-wrap", styles.price)}>
          <span className="text-2xl font-bold leading-normal">{price}</span>
          {priceSubtext && (
            <span className="text-slate-400 text-base font-normal leading-normal ml-1">
              {priceSubtext}
            </span>
          )}
        </div>
        {(isCurrentPlan || isPopular || isBestValue) && (
          <div className={cn("px-3 shrink-0", styles.badge)}>
            <div className="text-center text-sm font-normal whitespace-nowrap">
              {isBestValue
                ? "BEST VALUE"
                : isPopular
                ? "POPULAR"
                : "CURRENT PLAN"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

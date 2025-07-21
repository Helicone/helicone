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
        "flex h-full w-full flex-col gap-2 rounded-xl px-6 py-3",
        styles.container,
        onClick &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn("text-xl font-semibold leading-normal", styles.title)}
        >
          {isLoading ? "Loading..." : title}
        </div>
        {iconSrc ? (
          <div className="relative h-6 w-6 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="absolute left-0 top-0 h-5 w-5"
              src={iconSrc}
              alt={`${title} icon`}
            />
          </div>
        ) : (
          <div className={cn("h-5 w-5 text-current", styles.title)}>
            {styles.icon}
          </div>
        )}
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <div className={cn("flex flex-wrap items-baseline", styles.price)}>
          <span className="text-2xl font-bold leading-normal">{price}</span>
          {priceSubtext && (
            <span className="ml-1 text-base font-normal leading-normal text-slate-400">
              {priceSubtext}
            </span>
          )}
        </div>
        {(isCurrentPlan || isPopular || isBestValue) && (
          <div className={cn("shrink-0 px-3", styles.badge)}>
            <div className="whitespace-nowrap text-center text-sm font-normal">
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

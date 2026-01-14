import { Crown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnvironmentPillProps {
  environment: string;
  className?: string;
  onRemove?: () => void;
}

const EnvironmentPill = ({
  environment,
  className,
  onRemove,
}: EnvironmentPillProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
        environment === "production"
          ? "bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-500/30"
          : ["dev", "development", "staging"].includes(
                environment.toLowerCase(),
              )
            ? "bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-500/30"
            : "bg-gray-100 text-gray-800 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600/30",
        className,
      )}
    >
      {environment}
      {environment === "production" && <Crown className="ml-1 h-3 w-3" />}
      {onRemove && environment !== "production" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label={`Remove ${environment} environment`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

export default EnvironmentPill;

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnvironmentPillProps {
  environment: string;
  className?: string;
}

const EnvironmentPill = ({ environment, className }: EnvironmentPillProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
        environment === "production"
          ? "bg-green-100 text-green-800 ring-green-600/20"
          : ["dev", "development", "staging"].includes(
              environment.toLowerCase(),
            )
            ? "bg-blue-100 text-blue-800 ring-blue-600/20"
            : "bg-gray-100 text-gray-800 ring-gray-600/20",
        className
      )}
    >
      {environment}
      {environment === "production" && (
        <Crown className="ml-2 h-3 w-3" />
      )}
    </span>
  );
};

export default EnvironmentPill; 
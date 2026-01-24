import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/layout/org/organizationContext";

interface FreeTierExceededBannerProps {
  /**
   * Additional classes to apply to the banner
   */
  className?: string;
}

/**
 * Banner that shows when a free tier organization has exceeded their monthly request limit.
 * Warns users that request/response bodies are no longer being stored and logs may be inconsistent.
 */
export function FreeTierExceededBanner({
  className = "",
}: FreeTierExceededBannerProps) {
  const orgContext = useOrg();

  // Check if free tier limit is exceeded for the current month
  const isFreeLimitExceeded = useMemo(() => {
    const freeLimitMonth = orgContext?.currentOrg?.free_limit_exceeded;
    if (!freeLimitMonth || orgContext?.currentOrg?.tier !== "free") {
      return false;
    }
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    return freeLimitMonth === currentMonth;
  }, [
    orgContext?.currentOrg?.free_limit_exceeded,
    orgContext?.currentOrg?.tier,
  ]);

  if (!isFreeLimitExceeded) {
    return null;
  }

  return (
    <div
      className={`border-y border-destructive/30 bg-destructive/5 ${className}`}
    >
      <div className="mx-auto flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={16}
            className="flex-shrink-0 text-destructive"
          />
          <span className="text-sm font-medium text-destructive">
            Free tier limit exceeded
          </span>
          <span className="text-sm text-muted-foreground">
            Request/response bodies are no longer being stored. Your logs may be
            incomplete.
          </span>
        </div>
        <Link href="/settings/billing" className="ml-6 sm:ml-0">
          <Button variant="outline" size="sm">
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { P, Small } from "@/components/ui/typography";
import { X } from "lucide-react";
import { useState } from "react";

export function GatewayPromotionBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <div className="relative rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-2 top-2 rounded-lg p-1 hover:bg-sky-100 dark:hover:bg-sky-900"
      >
        <X size={16} className="text-sky-600 dark:text-sky-400" />
      </button>

      <div className="flex flex-col gap-3">
        <div>
          <P className="font-semibold text-sky-900 dark:text-sky-100">
            Switch to AI Gateway and save on costs
          </P>
          <Small className="text-sky-700 dark:text-sky-300">
            Use any LLM provider with automatic fallbacks and zero observability fees
          </Small>
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-sky-600 hover:bg-sky-700"
          >
            Learn More
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
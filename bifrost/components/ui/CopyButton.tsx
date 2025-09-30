"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  textToCopy: string;
  tooltipContent: string;
  copiedText?: string;
  className?: string;
  iconSize?: number;
  onCopy?: () => void;
}

export function CopyButton({
  textToCopy,
  tooltipContent,
  copiedText = "Copied!",
  className,
  iconSize = 14,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className={cn(
              "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors",
              className
            )}
          >
            {copied ? (
              <Check
                size={iconSize}
                className="text-green-500"
              />
            ) : (
              <Copy
                size={iconSize}
                className="text-gray-500 dark:text-gray-400"
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{copied ? copiedText : tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

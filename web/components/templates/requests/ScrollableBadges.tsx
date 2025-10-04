import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { XSmall } from "@/components/ui/typography";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { logger } from "@/lib/telemetry/logger";
import {
  LuCheck,
  LuExternalLink,
  LuListTree,
  LuPlus,
  LuScroll,
  LuX,
} from "react-icons/lu";
import useNotification from "@/components/shared/notification/useNotification";

// Special property or score keys map
const SPECIAL_KEYS: Record<
  string,
  { icon: React.ReactNode; hrefPrefix: string }
> = {
  "Helicone-Prompt-Id": {
    icon: <LuScroll className="h-4 w-4" />,
    hrefPrefix: "/prompts/",
  },
  "Helicone-Session-Id": {
    icon: <LuListTree className="h-4 w-4" />,
    hrefPrefix: "/sessions/",
  },
};

interface ScrollableBadgesProps {
  title?: string;
  items: { key: string; value: string | number }[];
  onAdd: (key: string, value: string) => Promise<void>;
  valueType?: "string" | "number" | "boolean";
  className?: string;
  placeholder?: string;
  tooltipText?: string;
  tooltipLink?: {
    url: string;
    text: string;
  };
}
export default function ScrollableBadges({
  title,
  items,
  onAdd,
  valueType = "string",
  className,
  placeholder,
  tooltipText,
  tooltipLink,
}: ScrollableBadgesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [pendingItems, setPendingItems] = useState<
    { key: string; value: string | number }[]
  >([]);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Clean up pending items when they appear in external items
  useEffect(() => {
    setPendingItems((prev) =>
      prev.filter(
        (pending) =>
          !items.some(
            (item) => item.key === pending.key && item.value === pending.value,
          ),
      ),
    );
  }, [items]);

  // Combine external items with pending items
  const allItems = useMemo(
    () =>
      [...items, ...pendingItems].sort((a, b) => {
        const aIsSpecial = SPECIAL_KEYS[a.key] !== undefined;
        const bIsSpecial = SPECIAL_KEYS[b.key] !== undefined;
        if (aIsSpecial && !bIsSpecial) return -1;
        if (!aIsSpecial && bIsSpecial) return 1;
        return 0;
      }),
    [items, pendingItems],
  );

  const scrollToEnd = () => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollLeft = scrollArea.scrollWidth;
    }
  };

  // Scroll to end when add button is clicked
  useEffect(() => {
    if (isAdding) scrollToEnd();
  }, [isAdding]);

  // Scroll to end when items change
  useEffect(() => {
    scrollToEnd();
  }, [allItems.length]);

  const handleAdd = async () => {
    if (!newKey || !newValue) return;

    try {
      setPendingItems((prev) => [...prev, { key: newKey, value: newValue }]);
      setNewKey("");
      setNewValue("");
      setIsAdding(false);
      await onAdd(newKey, newValue);
    } catch (error) {
      setPendingItems((prev) =>
        prev.filter(
          (item) => !(item.key === newKey && item.value === newValue),
        ),
      );
      logger.error({ error }, "Error adding item");
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleAdd();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewKey("");
      setNewValue("");
    }
  };

  return (
    <div
      className={`flex h-10 w-full shrink-0 grow-0 flex-row items-center justify-between ${
        !title ? "pr-4" : ""
      } ${className}`}
    >
      {title && (
        <XSmall className="font-semibold text-secondary">{title}</XSmall>
      )}

      <div className="relative flex h-full w-full items-center overflow-x-auto">
        <ScrollArea orientation="horizontal" width="thin">
          <div
            ref={scrollAreaRef}
            className="flex h-full w-full flex-row items-center gap-2"
          >
            {allItems.length === 0 && placeholder && !isAdding && (
              <p className="ml-4 flex h-full items-center text-xs text-muted-foreground/40">
                {placeholder}
              </p>
            )}

            {allItems.map((item, i) => (
              <ItemBadge
                key={`${item.key}-${item.value}-${i}`}
                item={item}
                isFirst={i === 0}
                isProperty={title === "Properties"}
              />
            ))}

            {isAdding && (
              <div
                className={`flex h-full flex-row items-center gap-1 ${
                  allItems.length === 0 ? "ml-4" : ""
                }`}
              >
                <Input
                  variant="helicone"
                  ref={keyInputRef}
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Key"
                  className="h-6 w-20 px-2 text-xs"
                  autoFocus
                />
                <Input
                  variant="helicone"
                  type={valueType === "number" ? "number" : "text"}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Value"
                  className="h-6 w-20 px-2 text-xs"
                />
                <Button
                  variant={"ghost"}
                  size={"square_icon"}
                  asPill
                  onClick={() => {
                    setIsAdding(false);
                    setNewKey("");
                    setNewValue("");
                  }}
                >
                  <LuX className="h-4 w-4" />
                </Button>
              </div>
            )}
            {/* Spacer to ensure right padding is scrollable (w-1 + gap-2 = w-3) */}
            <div className="w-2 shrink-0" />
          </div>
        </ScrollArea>
        {/* Gradient overlays - positioned at extreme edges */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-4 bg-gradient-to-r from-card to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-4 bg-gradient-to-l from-card to-transparent" />
      </div>

      <TooltipProvider>
        {/* Disabled when adding */}
        <Tooltip delayDuration={100} open={!isAdding && undefined}>
          <TooltipTrigger asChild>
            <Button
              variant={"ghost"}
              size={"square_icon"}
              className="shrink-0"
              asPill
              onClick={() => {
                if (isAdding) {
                  handleAdd();
                } else {
                  setIsAdding(true);
                }
              }}
            >
              {isAdding ? (
                <LuCheck className="h-4 w-4" />
              ) : (
                <LuPlus className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          {(tooltipText || tooltipLink) && (
            <TooltipContent side="left" className="flex flex-col gap-1 text-xs">
              {tooltipText && <span>{tooltipText}</span>}
              {tooltipLink && (
                <div className="flex items-center justify-center gap-1">
                  <Link
                    href={tooltipLink.url}
                    target="_blank"
                    className="flex items-center gap-1 text-sky-500 hover:underline"
                  >
                    {tooltipLink.text}
                    <LuExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Memoized ItemBadge component
const ItemBadge = memo(
  ({
    item,
    isFirst,
    isProperty,
  }: {
    item: { key: string; value: string | number };
    isFirst: boolean;
    isProperty?: boolean;
  }) => {
    const { setNotification } = useNotification();
    const [showLinkButton, setShowLinkButton] = useState(false);
    const isSpecial = SPECIAL_KEYS[item.key];

    const handleCopy = () => {
      const textToCopy = `${item.key}: ${item.value}`;
      navigator.clipboard.writeText(textToCopy);
      setNotification("Copied to clipboard", "success");
    };

    const handleLinkClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    if (isSpecial) {
      return (
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowLinkButton(true)}
          onMouseLeave={() => setShowLinkButton(false)}
        >
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Badge
                  variant={"none"}
                  className={`flex h-6 flex-row gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-900 ${
                    isFirst ? "ml-4" : ""
                  } cursor-pointer border border-border hover:bg-slate-200 dark:hover:bg-slate-800 ${
                    showLinkButton ? "pr-7" : ""
                  }`}
                  onClick={handleCopy}
                >
                  {isSpecial.icon}
                  <span className="text-nowrap font-medium text-primary">
                    {item.value}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Click to copy
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {showLinkButton && (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Link
                    href={`${isSpecial.hrefPrefix}${item.value}`}
                    target="_blank"
                    onClick={handleLinkClick}
                    className="absolute right-1 flex h-4 w-4 items-center justify-center rounded hover:bg-slate-300 dark:hover:bg-slate-700"
                  >
                    <LuExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Open in new tab
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    // If it's a property (and not special)
    if (isProperty) {
      return (
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowLinkButton(true)}
          onMouseLeave={() => setShowLinkButton(false)}
        >
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Badge
                  variant={"none"}
                  className={`flex h-6 flex-row gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-900 ${
                    isFirst ? "ml-4" : ""
                  } cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 ${
                    showLinkButton ? "pr-7" : ""
                  }`}
                  onClick={handleCopy}
                >
                  <span className="text-nowrap text-muted-foreground">
                    {item.key}
                  </span>{" "}
                  <span className="text-nowrap font-medium text-primary">
                    {item.value}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Click to copy
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {showLinkButton && (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/properties/${encodeURIComponent(item.key)}`}
                    target="_blank"
                    onClick={handleLinkClick}
                    className="absolute right-1 flex h-4 w-4 items-center justify-center rounded hover:bg-slate-300 dark:hover:bg-slate-700"
                  >
                    <LuExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  View property
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    // Otherwise (e.g., scores), render the badge with copy only
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Badge
              variant={"none"}
              className={`flex h-6 flex-row gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-900 ${
                isFirst ? "ml-4" : ""
              } cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800`}
              onClick={handleCopy}
            >
              <span className="text-nowrap text-muted-foreground">
                {item.key}
              </span>{" "}
              <span className="text-nowrap font-medium text-primary">
                {item.value}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Click to copy
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
ItemBadge.displayName = "ItemBadge";

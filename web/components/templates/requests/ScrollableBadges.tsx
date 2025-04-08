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
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  LuCheck,
  LuExternalLink,
  LuListTree,
  LuPlus,
  LuScroll,
  LuX,
} from "react-icons/lu";

// Special property or score keys map
const SPECIAL_KEYS: Record<
  string,
  { icon: React.ReactNode; hrefPrefix: string }
> = {
  "Helicone-Prompt-Id": {
    icon: <LuScroll className="w-4 h-4" />,
    hrefPrefix: "/prompts/",
  },
  "Helicone-Session-Id": {
    icon: <LuListTree className="w-4 h-4" />,
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
            (item) => item.key === pending.key && item.value === pending.value
          )
      )
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
    [items, pendingItems]
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
        prev.filter((item) => !(item.key === newKey && item.value === newValue))
      );
      console.error("Error adding item:", error);
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
      className={`h-10 w-full flex flex-row grow-0 shrink-0 justify-between items-center ${
        !title ? "pr-4" : ""
      } ${className}`}
    >
      {title && (
        <XSmall className="font-semibold text-secondary">{title}</XSmall>
      )}

      <div className="h-full w-full flex items-center relative overflow-x-auto">
        <ScrollArea orientation="horizontal" width="thin">
          <div
            ref={scrollAreaRef}
            className="h-full w-full flex flex-row items-center gap-2"
          >
            {allItems.length === 0 && placeholder && !isAdding && (
              <p className="h-full flex items-center ml-4 text-xs text-muted-foreground/40">
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
                className={`h-full flex flex-row gap-1 items-center ${
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
                  className="h-6 w-20 text-xs px-2"
                  autoFocus
                />
                <Input
                  variant="helicone"
                  type={valueType === "number" ? "number" : "text"}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Value"
                  className="h-6 w-20 text-xs px-2"
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
                  <LuX className="w-4 h-4" />
                </Button>
              </div>
            )}
            {/* Spacer to ensure right padding is scrollable (w-1 + gap-2 = w-3) */}
            <div className="w-2 shrink-0" />
          </div>
        </ScrollArea>
        {/* Gradient overlays - positioned at extreme edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-card to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-card to-transparent pointer-events-none" />
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
                <LuCheck className="w-4 h-4" />
              ) : (
                <LuPlus className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          {(tooltipText || tooltipLink) && (
            <TooltipContent side="left" className="text-xs flex flex-col gap-1">
              {tooltipText && <span>{tooltipText}</span>}
              {tooltipLink && (
                <div className="flex items-center justify-center gap-1">
                  <Link
                    href={tooltipLink.url}
                    target="_blank"
                    className="text-sky-500 hover:underline flex items-center gap-1 "
                  >
                    {tooltipLink.text}
                    <LuExternalLink className="w-3 h-3" />
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
    const isSpecial = SPECIAL_KEYS[item.key];

    if (isSpecial) {
      return (
        <Link href={`${isSpecial.hrefPrefix}${item.value}`} target="_blank">
          <Badge
            variant={"none"}
            className={`h-6 flex flex-row gap-2 px-2 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 ${
              isFirst ? "ml-4" : ""
            } border border-border hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer`}
          >
            {isSpecial.icon}
            <span className="text-primary font-medium text-nowrap">
              {item.value}
            </span>
          </Badge>
        </Link>
      );
    }

    // If it's a property (and not special), wrap it in a Link
    if (isProperty) {
      return (
        <Link href={`/properties/${encodeURIComponent(item.key)}`}>
          <Badge
            variant={"none"}
            className={`h-6 flex flex-row gap-2 px-2 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 ${
              isFirst ? "ml-4" : ""
            } hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer`}
          >
            <span className="text-muted-foreground text-nowrap">
              {item.key}
            </span>{" "}
            <span className="text-primary font-medium text-nowrap">
              {item.value}
            </span>
          </Badge>
        </Link>
      );
    }

    // Otherwise (e.g., scores), render the badge without a link
    return (
      <Badge
        variant={"none"}
        className={`h-6 flex flex-row gap-2 px-2 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 ${
          isFirst ? "ml-4" : ""
        }`}
      >
        <span className="text-muted-foreground text-nowrap">{item.key}</span>{" "}
        <span className="text-primary font-medium text-nowrap">
          {item.value}
        </span>
      </Badge>
    );
  }
);
ItemBadge.displayName = "ItemBadge";

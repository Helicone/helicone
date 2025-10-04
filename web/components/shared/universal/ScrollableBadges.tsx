import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/lib/telemetry/logger";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { XSmall } from "@/components/ui/typography";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  LuCheck,
  LuExternalLink,
  LuListTree,
  LuPlus,
  LuScroll,
  LuX,
} from "react-icons/lu";

// Define item types
type KeyValueItem = { key: string; value: string | number };
type SingleValueItem = string | number;

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

// Define base props common to both modes
interface ScrollableBadgesBaseProps {
  title?: string;
  valueType?: "string" | "number";
  className?: string;
  placeholder?: string;
  tooltipText?: string;
  tooltipLink?: {
    url: string;
    text: string;
  };
}

// Define props specific to each mode using discriminated union
type ScrollableBadgesProps = ScrollableBadgesBaseProps &
  (
    | {
        mode?: "keyValue";
        items: KeyValueItem[];
        onAdd: (key: string, value: string) => Promise<void>;
      }
    | {
        mode: "singleValue";
        items: SingleValueItem[];
        onAdd: (value: string) => Promise<void>;
      }
  );

export default function ScrollableBadges({
  title,
  items,
  onAdd,
  mode = "keyValue", // Default to keyValue mode
  valueType = "string",
  className,
  placeholder,
  tooltipText,
  tooltipLink,
}: ScrollableBadgesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  // Adjust pendingItems type based on mode
  const [pendingItems, setPendingItems] = useState<
    KeyValueItem[] | SingleValueItem[]
  >([]);
  const valueInputRef = useRef<HTMLInputElement>(null); // Use for single value focus
  const keyInputRef = useRef<HTMLInputElement>(null); // Keep for keyValue focus
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Reset state when mode changes (optional, but good practice)
  useEffect(() => {
    setIsAdding(false);
    setNewKey("");
    setNewValue("");
    setPendingItems([]);
  }, [mode]);

  // Clean up pending items when they appear in external items
  useEffect(() => {
    setPendingItems((prev) => {
      if (mode === "singleValue") {
        const externalValues = items as SingleValueItem[];
        return (prev as SingleValueItem[]).filter(
          (pendingValue) => !externalValues.includes(pendingValue),
        );
      } else {
        const externalKeyValues = items as KeyValueItem[];
        return (prev as KeyValueItem[]).filter(
          (pending) =>
            !externalKeyValues.some(
              (item) =>
                item.key === pending.key && item.value === pending.value,
            ),
        );
      }
    });
  }, [items, mode]);

  // Combine external items with pending items
  const allItems: (KeyValueItem | SingleValueItem)[] = useMemo(() => {
    const combined = [...items, ...pendingItems];
    if (mode === "keyValue") {
      return (combined as KeyValueItem[]).sort((a, b) => {
        const aIsSpecial = SPECIAL_KEYS[a.key] !== undefined;
        const bIsSpecial = SPECIAL_KEYS[b.key] !== undefined;
        if (aIsSpecial && !bIsSpecial) return -1;
        if (!aIsSpecial && bIsSpecial) return 1;
        return 0;
      });
    }
    // No special sorting for singleValue mode needed currently
    return combined;
  }, [items, pendingItems, mode]);

  const scrollToEnd = () => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollLeft = scrollArea.scrollWidth;
    }
  };

  // Scroll to end when add button is clicked or items change
  useEffect(() => {
    scrollToEnd();
  }, [allItems.length, isAdding]);

  // Focus input when isAdding becomes true
  useEffect(() => {
    if (isAdding) {
      if (mode === "singleValue") {
        valueInputRef.current?.focus();
      } else {
        keyInputRef.current?.focus();
      }
    }
  }, [isAdding, mode]);

  const handleAdd = async () => {
    if (mode === "singleValue") {
      if (!newValue) return;
      try {
        setPendingItems((prev) => [...(prev as SingleValueItem[]), newValue]);
        setNewValue("");
        setIsAdding(false);
        await (onAdd as (value: string) => Promise<void>)(newValue);
      } catch (error) {
        setPendingItems((prev) =>
          (prev as SingleValueItem[]).filter((item) => item !== newValue),
        );
        logger.error(error, "Error adding item");
      }
    } else {
      if (!newKey || !newValue) return;
      try {
        setPendingItems((prev) => [
          ...(prev as KeyValueItem[]),
          { key: newKey, value: newValue },
        ]);
        setNewKey("");
        setNewValue("");
        setIsAdding(false);
        await (onAdd as (key: string, value: string) => Promise<void>)(
          newKey,
          newValue,
        );
      } catch (error) {
        setPendingItems((prev) =>
          (prev as KeyValueItem[]).filter(
            (item) => !(item.key === newKey && item.value === newValue),
          ),
        );
        logger.error(error, "Error adding item");
      }
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
      className={`flex h-10 w-full flex-row items-center justify-between ${
        !title ? "pr-4" : ""
      } ${className}`}
    >
      {title && (
        <XSmall className="font-semibold text-secondary">{title}</XSmall>
      )}

      <div className="relative flex h-full w-full items-center overflow-x-auto">
        <ScrollArea orientation="horizontal" className="w-full">
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
                key={
                  mode === "singleValue"
                    ? `${item}-${i}`
                    : `${(item as KeyValueItem).key}-${
                        (item as KeyValueItem).value
                      }-${i}`
                }
                item={item}
                mode={mode}
                isFirst={i === 0}
              />
            ))}

            {isAdding && (
              <div
                className={`flex h-full flex-row items-center gap-1 ${
                  allItems.length === 0 ? "ml-4" : ""
                }`}
              >
                {mode === "keyValue" && (
                  <Input
                    variant="helicone"
                    ref={keyInputRef}
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Key"
                    className="h-6 w-20 px-2 text-xs"
                  />
                )}
                <Input
                  variant="helicone"
                  ref={valueInputRef} // Assign ref here
                  type={valueType === "number" ? "number" : "text"}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={mode === "singleValue" ? "Value" : "Value"}
                  className="h-6 w-20 px-2 text-xs"
                  autoFocus={mode === "singleValue"} // Autofocus value input in singleValue mode
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
    mode,
    isFirst,
  }: {
    item: KeyValueItem | SingleValueItem;
    mode: "keyValue" | "singleValue";
    isFirst: boolean;
  }) => {
    if (mode === "keyValue") {
      const kvItem = item as KeyValueItem;
      const isSpecial = SPECIAL_KEYS[kvItem.key];

      if (isSpecial) {
        return (
          <Link href={`${isSpecial.hrefPrefix}${kvItem.value}`} target="_blank">
            <Badge
              variant={"none"}
              className={`flex h-6 flex-row gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-900 ${
                isFirst ? "ml-4" : ""
              } cursor-pointer border border-border hover:bg-slate-200 dark:hover:bg-slate-800`}
            >
              {isSpecial.icon}
              <span className="text-nowrap font-medium text-primary">
                {kvItem.value}
              </span>
            </Badge>
          </Link>
        );
      }

      return (
        <Badge
          variant={"none"}
          className={`flex h-6 flex-row gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-900 ${
            isFirst ? "ml-4" : ""
          }`}
        >
          <span className="text-nowrap text-muted-foreground">
            {kvItem.key}
          </span>{" "}
          <span className="text-nowrap font-medium text-primary">
            {kvItem.value}
          </span>
        </Badge>
      );
    } else {
      // Single value mode
      const valueItem = item as SingleValueItem;
      return (
        <Badge
          variant={"none"}
          className={`flex h-6 flex-row gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-900 ${
            isFirst ? "ml-4" : ""
          }`}
        >
          <span className="text-nowrap font-medium text-primary">
            {valueItem}
          </span>
        </Badge>
      );
    }
  },
);
ItemBadge.displayName = "ItemBadge";

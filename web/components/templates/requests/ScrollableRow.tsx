import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XSmall } from "@/components/ui/typography";
import Link from "next/link";
import { useRef, useState } from "react";
import { LuCheck, LuListTree, LuPlus, LuScroll } from "react-icons/lu";

// Special property keys map
const SPECIAL_PROPERTY_KEYS: Record<
  string,
  { icon: React.ReactNode; hrefPrefix: string }
> = {
  "Helicone-Prompt-Id": {
    icon: <LuScroll className="w-3 h-3" />,
    hrefPrefix: "/prompts/",
  },
  "Helicone-Session-Id": {
    icon: <LuListTree className="w-3 h-3" />,
    hrefPrefix: "/sessions/",
  },
};

interface ScrollableRowProps {
  title?: string;
  items: { key: string; value: string | number }[];
  onAdd: (key: string, value: string) => Promise<void>;
  valueType?: "string" | "number" | "boolean";
  className?: string;
}
export default function ScrollableRow({
  title,
  items,
  onAdd,
  valueType = "string",
  className,
}: ScrollableRowProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const keyInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!newKey || !newValue) return;

    try {
      await onAdd(newKey, newValue);
      setNewKey("");
      setNewValue("");
      setIsAdding(false);

      //   // Scroll to the right after a short delay to allow for DOM update
      //   setTimeout(() => {
      //     const scrollContainer = scrollViewportRef.current?.closest(
      //       "[data-radix-scroll-area-viewport]"
      //     );
      //     if (scrollContainer) {
      //       (scrollContainer as HTMLElement).scrollTo({
      //         left: (scrollContainer as HTMLElement).scrollWidth,
      //         behavior: "smooth",
      //       });
      //     }
      //   }, 100);
    } catch (error) {
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
      className={`h-6 w-full flex flex-row justify-between items-center ${
        !title ? "pr-3" : ""
      } ${className}`}
    >
      {title && (
        <XSmall className="font-medium text-secondary shrink-0">{title}</XSmall>
      )}

      <div className="w-full relative">
        <ScrollArea orientation="horizontal" className="w-full">
          <div className="flex flex-row gap-2 w-full">
            {items.map((item, i) => {
              const isSpecial = SPECIAL_PROPERTY_KEYS[item.key];

              return isSpecial ? (
                <Link
                  href={`${isSpecial.hrefPrefix}${item.value}`}
                  key={i}
                  target="_blank"
                  className="shrink-0"
                >
                  <Badge
                    variant={"none"}
                    className={`flex flex-row gap-2 px-2 py-1 rounded-lg text-xs shrink-0 bg-slate-100 dark:bg-slate-900 ${
                      i === 0 ? "ml-3" : ""
                    } border border-border hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer`}
                  >
                    {isSpecial.icon}
                    <span className="text-primary font-medium text-nowrap">
                      {item.value}
                    </span>
                  </Badge>
                </Link>
              ) : (
                <Badge
                  variant={"none"}
                  key={i}
                  className={`flex flex-row gap-2 px-2 py-1 rounded-lg text-xs shrink-0 bg-slate-100 dark:bg-slate-900 ${
                    i === 0 ? "ml-3" : ""
                  }`}
                >
                  <span className="text-muted-foreground text-nowrap">
                    {item.key}
                  </span>{" "}
                  <span className="text-primary font-medium text-nowrap">
                    {item.value}
                  </span>
                </Badge>
              );
            })}
            {isAdding && (
              <div className="flex flex-row gap-1 items-center shrink-0">
                <Input
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
                  type={valueType === "number" ? "number" : "text"}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Value"
                  className="h-6 w-20 text-xs px-2"
                />
              </div>
            )}
            {/* Spacer to ensure right padding is scrollable (w-1 + gap-2 = w-3) */}
            <div className="w-1 shrink-0" />
          </div>
        </ScrollArea>
        {/* Gradient overlays - positioned at extreme edges */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white to-transparent dark:from-black pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-white to-transparent dark:from-black pointer-events-none" />
      </div>

      <Button
        variant={"ghost"}
        size={"square_icon"}
        asPill
        className="shrink-0"
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
    </div>
  );
}

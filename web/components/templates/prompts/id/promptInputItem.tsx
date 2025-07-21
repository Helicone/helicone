import React, { useState, useRef, useEffect } from "react";

import type { paths as publicPaths } from "../../../../lib/clients/jawnTypes/public";
import type { paths as privatePaths } from "../../../../lib/clients/jawnTypes/private";
import { Button } from "@/components/ui/button";
import { ExpandIcon, ShrinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PromptInput = NonNullable<
  (publicPaths &
    privatePaths)["/v1/prompt/version/{promptVersionId}/inputs/query"]["post"]["responses"]["200"]["content"]["application/json"]["data"]
>[0];
interface PromptInputItemProps {
  input: PromptInput;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (input: PromptInput) => void;
}

const PromptInputItem: React.FC<PromptInputItemProps> = ({
  input,
  isSelected,
  isFirst,
  isLast,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowed, setIsOverflowed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const MAX_HEIGHT = 155; // Corresponds to max-h-40 (40 * 4px in Tailwind)

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowed(contentRef.current.scrollHeight > MAX_HEIGHT);
    }

    // also check on window resize
    const handleResize = () => {
      if (contentRef.current) {
        setIsOverflowed(contentRef.current.scrollHeight > MAX_HEIGHT);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [input, isExpanded]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <li
      className={`relative flex w-full flex-col ${
        isSelected
          ? "bg-sky-100 dark:bg-sky-900"
          : "bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800"
      } ${isFirst ? "border-t border-slate-300 dark:border-slate-700" : ""} ${
        isLast ? "border-b border-slate-300 dark:border-slate-700" : ""
      }`}
    >
      <div className="absolute left-0 flex h-full items-center">
        {isSelected && <div className="h-full w-1 bg-sky-500" />}
      </div>
      <div
        ref={contentRef}
        className={`flex-grow cursor-pointer p-4 ${
          !isFirst ? "border-t border-slate-300 dark:border-slate-700" : ""
        } ${isExpanded ? "" : `overflow-hidden`}`}
        style={
          isExpanded
            ? {}
            : {
                maxHeight: `${MAX_HEIGHT}px`,
              }
        }
        onClick={() => onSelect(input)}
      >
        {Object.entries(input.inputs).map(([key, value], index) => (
          <div key={index} className="mb-2 text-sm last:mb-0">
            <span className="font-medium text-sky-500">{key}: </span>
            <span className="text-slate-700 dark:text-slate-300">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </span>
          </div>
        ))}
        {input.auto_prompt_inputs && input.auto_prompt_inputs.length > 0 && (
          <div className="mt-2 text-sm">
            <span className="font-medium text-sky-500">messages: </span>
            <span className="text-slate-700 dark:text-slate-300">
              {JSON.stringify(input.auto_prompt_inputs)}
              ...
            </span>
          </div>
        )}
        {input.response_body && (
          <div className="mt-2 text-sm">
            <span className="font-medium text-sky-500">messages: </span>
            <span className="text-slate-700 dark:text-slate-300">
              {JSON.stringify(
                (input.response_body as any)?.choices?.[0]?.message,
              )}
            </span>
          </div>
        )}
      </div>
      {isOverflowed && !isExpanded && (
        <div
          className={cn(
            "absolute bottom-0 h-1/2 bg-gradient-to-b from-transparent to-white dark:to-slate-950/50",
            isSelected
              ? "left-1 w-[calc(100%-0.25rem)] to-sky-100 dark:to-sky-900/50"
              : "left-0 w-full to-white dark:to-slate-950",
          )}
          onClick={() => onSelect(input)}
        />
      )}
      {isOverflowed && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 border border-slate-200 p-2 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 dark:active:bg-slate-800"
          onClick={toggleExpand}
        >
          {isExpanded ? (
            <ShrinkIcon
              width={16}
              height={16}
              className="text-slate-900 dark:text-slate-200"
            />
          ) : (
            <ExpandIcon
              width={16}
              height={16}
              className="text-slate-900 dark:text-slate-200"
            />
          )}
        </Button>
      )}
    </li>
  );
};

export default PromptInputItem;

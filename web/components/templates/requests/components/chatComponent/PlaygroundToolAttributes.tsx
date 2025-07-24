import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { XSmall } from "@/components/ui/typography";
import { useEffect, useRef, useState } from "react";

interface PlaygroundToolAttributesProps {
  toolName?: string;
  toolCallId?: string;
  updateToolName: (_name: string) => void;
  updateToolCallId: (_callId: string) => void;
}

export default function PlaygroundToolAttributes({
  toolName,
  toolCallId,
  updateToolName,
  updateToolCallId,
}: PlaygroundToolAttributesProps) {
  const [isEditingCallId, setIsEditingCallId] = useState(false);
  const callIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingCallId) {
      callIdInputRef.current?.focus();
    }
  }, [isEditingCallId]);

  return (
    <div className="flex w-full items-center gap-2">
      <Input
        className="h-auto w-auto px-2 py-1 text-xs"
        value={toolName}
        onChange={(e) => updateToolName(e.target.value)}
        placeholder="Function Name"
      />
      {isEditingCallId ? (
        <Input
          ref={callIdInputRef}
          className="h-auto w-full rounded border-0 border-none !bg-transparent px-[5px] py-0 text-xs outline-none focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus:ring-slate-300"
          value={toolCallId}
          onBlur={() => setIsEditingCallId(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsEditingCallId(false);
            }
          }}
          onChange={(e) => updateToolCallId(e.target.value)}
          placeholder="Tool Call ID"
        />
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <XSmall
              onClick={() => setIsEditingCallId(true)}
              className="w-full max-w-fit cursor-pointer rounded border border-dashed border-transparent px-1 font-medium italic transition-colors duration-150 hover:border-slate-300 dark:hover:border-slate-600"
            >
              {toolCallId}
            </XSmall>
          </TooltipTrigger>
          <TooltipContent>Click to edit</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

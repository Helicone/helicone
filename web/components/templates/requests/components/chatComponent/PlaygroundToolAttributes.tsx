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
    <div className="flex items-center gap-2 w-full">
      <Input
        className="text-xs h-auto py-1 px-2 w-auto"
        value={toolName}
        onChange={(e) => updateToolName(e.target.value)}
        placeholder="Function Name"
      />
      {isEditingCallId ? (
        <Input
          ref={callIdInputRef}
          className="text-xs !bg-transparent border-none focus:ring-slate-300 rounded px-[5px] py-0 w-full h-auto border-0 outline-none focus:border-0 focus:ring-0 focus:shadow-none focus:outline-none"
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
              className="italic font-medium cursor-pointer px-1 rounded transition-colors duration-150 border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-600 w-full max-w-fit"
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

import { LLMRequestBody } from "@/packages/llm-mapper/types";
import { useRouter } from "next/router";
import React from "react";
import { useCreatePrompt } from "../../../../../services/hooks/prompts/prompts";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Maximize } from "lucide-react";

export const PROMPT_MODES = ["Pretty", "JSON", "Markdown", "Debug"] as const;

function cycleMode(
  mode: (typeof PROMPT_MODES)[number],
  isShiftKeyPressed: boolean
): (typeof PROMPT_MODES)[number] {
  if (isShiftKeyPressed) {
    return "Debug";
  }
  const index = PROMPT_MODES.indexOf(mode);
  return PROMPT_MODES[(index + 1) % (PROMPT_MODES.length - 1)];
}

export interface ChatTopBarProps {
  allExpanded: boolean;
  toggleAllExpanded: () => void;
  requestBody: LLMRequestBody;
  requestId: string;
  setOpen: (open: boolean) => void;
  mode: (typeof PROMPT_MODES)[number];
  setMode: (mode: (typeof PROMPT_MODES)[number]) => void;
  isModal?: boolean;
  promptData?: any;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
  allExpanded,
  toggleAllExpanded,
  requestId,
  requestBody,
  setOpen,
  mode,
  setMode,
  isModal = false,
  promptData,
}) => {
  const router = useRouter();
  const createPrompt = useCreatePrompt();

  return (
    <div className="flex flex-row items-center justify-between w-full bg-secondary py-1 px-2">
      {!isModal && (
        <Button
          onClick={() => setOpen(true)}
          variant="ghost"
          size="sm"
          className="px-2 py-1 gap-1.5 h-6 hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground"
        >
          <Maximize className="h-3 w-3" />
          <span className="text-xs font-medium">Expand</span>
        </Button>
      )}
      <Button
        onClick={(e) => {
          setMode(cycleMode(mode, e.shiftKey));
        }}
        variant="ghost"
        size="sm"
        className="px-2 py-1 gap-1.5 h-6 hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground"
      >
        <ChevronsUpDown className="h-3 w-3" />
        <span className="text-xs font-medium">{mode}</span>
      </Button>
    </div>
  );
};

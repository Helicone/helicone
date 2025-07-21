import { LLMRequestBody } from "@helicone-package/llm-mapper/types";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import {
  ArrowsPointingOutIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import { PROMPT_MODES } from "../chatComponent/chatTopBar";

function cycleMode(
  mode: (typeof PROMPT_MODES)[number],
  isShiftKeyPressed: boolean,
): (typeof PROMPT_MODES)[number] {
  if (isShiftKeyPressed) {
    return "Debug";
  }
  const index = PROMPT_MODES.indexOf(mode);
  return PROMPT_MODES[(index + 1) % (PROMPT_MODES.length - 1)];
}

interface ToolTopBarProps {
  allExpanded: boolean;
  toggleAllExpanded: () => void;
  requestBody: LLMRequestBody;
  requestId: string;
  setOpen: (open: boolean) => void;
  mode: (typeof PROMPT_MODES)[number];
  setMode: (mode: (typeof PROMPT_MODES)[number]) => void;
  isModal?: boolean;
}

export const ToolTopBar: React.FC<ToolTopBarProps> = ({
  allExpanded,
  toggleAllExpanded,
  setOpen,
  mode,
  setMode,
  isModal = false,
}) => {
  return (
    <div className="flex h-10 w-full flex-row items-center justify-between rounded-md bg-slate-50 px-2 text-slate-900 dark:bg-black dark:text-slate-100">
      <div className="flex flex-row items-center space-x-2">
        <button
          onClick={toggleAllExpanded}
          className="flex flex-row items-center space-x-1 rounded-lg px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          {allExpanded ? (
            <EyeSlashIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
          <p className="text-xs font-semibold">
            {allExpanded ? "Shrink All" : "Expand All"}
          </p>
        </button>
      </div>
      <div className="flex flex-row items-center space-x-2">
        {!isModal && (
          <button
            onClick={() => setOpen(true)}
            className="flex flex-row items-center space-x-1 rounded-lg px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
            <p className="text-xs font-semibold">Expand</p>
          </button>
        )}
        <button
          onClick={(e) => {
            setMode(cycleMode(mode, e.shiftKey));
          }}
          className="flex flex-row items-center space-x-1 rounded-lg px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <ChevronUpDownIcon className="h-4 w-4" />
          <p className="text-xs font-semibold">{mode}</p>
        </button>
      </div>
    </div>
  );
};
